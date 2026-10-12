/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <algorithm>
#include <cassert>
#include <cstdint>
#include <iostream>
#include <map>
#include <memory>
#include <string>
#include <type_traits>
#include <utility>
#include <vector>

// Native method bodies are included unchanged; EGL, FDs and mutexes are
// operation-ledger stand-ins, not real GPU or OS lifetime evidence.
struct Trace {
  std::vector<std::string> calls;
  int nextFD = 10;
  int nextSync = 1;
  bool cloneFails = false;
  bool pollSucceeds = true;
  unsigned waitsUnderLock = 0;
  unsigned resetsUnderLock = 0;
  unsigned duplicateDestroys = 0;
  unsigned failures = 0;

  void Add(const std::string& value) { calls.push_back(value); }
  void Check(bool value, const std::string& message) {
    if (!value) {
      ++failures;
      std::cerr << "FAIL " << message << '\n';
    }
  }
  unsigned Count(const std::string& prefix) const {
    return std::count_if(calls.begin(), calls.end(), [&](const auto& call) {
      return call.starts_with(prefix);
    });
  }
};
static Trace* trace;
static unsigned locked = 0;

struct Mutex {
  bool held = false;
};
class MutexAutoLock {
  Mutex& mutex;

 public:
  explicit MutexAutoLock(Mutex& value) : mutex(value) {
    assert(!mutex.held);
    mutex.held = true;
    ++locked;
  }
  ~MutexAutoLock() {
    --locked;
    mutex.held = false;
  }
};

template <typename F>
class ScopeExit {
  F function;

 public:
  explicit ScopeExit(F&& value) : function(std::move(value)) {}
  ~ScopeExit() { function(); }
};
template <typename F>
ScopeExit<F> MakeScopeExit(F&& function) {
  return ScopeExit<F>(std::forward<F>(function));
}

template <typename T>
class RefPtr {
  std::shared_ptr<T> pointer;

 public:
  RefPtr() = default;
  RefPtr(std::nullptr_t) {}
  RefPtr(T* value) {
    if (value) {
      pointer = value->weak_from_this().lock();
      if (!pointer) pointer.reset(value);
    }
  }
  T* get() const { return pointer.get(); }
  operator T*() const { return get(); }
  T* operator->() const { return get(); }
  RefPtr forget() { return std::exchange(*this, {}); }
};

class UniqueFileHandle {
  int value = -1;

 public:
  UniqueFileHandle() = default;
  explicit UniqueFileHandle(int fd) : value(fd) {}
  UniqueFileHandle(UniqueFileHandle&& other)
      : value(std::exchange(other.value, -1)) {}
  UniqueFileHandle(const UniqueFileHandle&) = delete;
  ~UniqueFileHandle() {
    if (value >= 0) trace->Add("close:" + std::to_string(value));
  }
  int get() const { return value; }
  int release() { return std::exchange(value, -1); }
};

namespace gfx {
class FileHandleWrapper
    : public std::enable_shared_from_this<FileHandleWrapper> {
  const UniqueFileHandle handle;

 public:
  explicit FileHandleWrapper(UniqueFileHandle&& value)
      : handle(std::move(value)) {}
  int GetHandle() { return handle.get(); }
  UniqueFileHandle ClonePlatformHandle() {
    trace->Add("clone:" + std::to_string(GetHandle()));
    return UniqueFileHandle(
        trace->cloneFails || GetHandle() < 0 ? -1 : trace->nextFD++);
  }
};
}  // namespace gfx

using EGLint = int;
using EGLTime = uint64_t;
using GLuint = unsigned;
using GLenum = unsigned;
constexpr GLenum LOCAL_GL_HANDLE_TYPE_OPAQUE_FD_EXT = 4;
constexpr GLenum LOCAL_GL_LAYOUT_COLOR_ATTACHMENT_EXT = 5;
constexpr GLenum LOCAL_GL_NO_ERROR = 0;
struct Sync {
  int id;
  int importedFD;
  bool alive = true;
  bool retainedAfterFlush = false;
};
using EGLSync = Sync*;
using EGLSyncKHR = Sync*;
constexpr int LOCAL_EGL_SYNC_NATIVE_FENCE_ANDROID = 1;
constexpr int LOCAL_EGL_SYNC_NATIVE_FENCE_FD_ANDROID = 2;
constexpr int LOCAL_EGL_NONE = 0;
constexpr int LOCAL_EGL_CONDITION_SATISFIED = 3;
constexpr EGLTime LOCAL_EGL_FOREVER = UINT64_MAX;
enum class EGLExtension { KHR_fence_sync, ANDROID_native_fence_sync };

namespace gl {
class DMABufProducerFence;
class EglDisplay {
 public:
  bool extensions = true;
  bool fenceExtension = true;
  bool nativeExtension = true;
  bool createFails = false;
  bool importFails = false;
  bool exportFails = false;
  bool waitFails = false;
  std::map<int, std::unique_ptr<Sync>> syncs;

  ~EglDisplay() {
    for (const auto& [id, sync] : syncs) {
      trace->Check(!sync->alive, "all syncs destroyed before their display");
    }
    trace->Add("display-destroy");
  }
  bool IsExtensionSupported(EGLExtension extension) const {
    return extensions &&
           (extension == EGLExtension::KHR_fence_sync ? fenceExtension
                                                      : nativeExtension);
  }
  EGLSync fCreateSyncKHR(int type, const int* attrs) {
    assert(type == LOCAL_EGL_SYNC_NATIVE_FENCE_ANDROID);
    const bool imported = attrs != nullptr;
    if (imported) {
      assert(attrs[0] == LOCAL_EGL_SYNC_NATIVE_FENCE_FD_ANDROID);
      assert(attrs[2] == LOCAL_EGL_NONE);
    }
    if (imported ? importFails : createFails) {
      trace->Add(imported ? "import-fail" : "create-fail");
      return nullptr;
    }
    int id = trace->nextSync++;
    syncs[id] = std::make_unique<Sync>(Sync{id, imported ? attrs[1] : -1});
    trace->Add(std::string(imported ? "import:" : "create:") +
               std::to_string(id));
    return syncs[id].get();
  }
  int fDupNativeFenceFDANDROID(EGLSync sync) {
    assert(sync && sync->alive);
    trace->Add("export:" + std::to_string(sync->id));
    return exportFails ? -1 : trace->nextFD++;
  }
  int fClientWaitSync(EGLSync sync, int flags, EGLTime timeout) {
    assert(sync && sync->alive);
    assert(flags == 0 && timeout == LOCAL_EGL_FOREVER);
    if (locked) ++trace->waitsUnderLock;
    trace->Add("wait:" + std::to_string(sync->id));
    if (std::exchange(waitFails, false)) return 0;
    return LOCAL_EGL_CONDITION_SATISFIED;
  }
  bool fDestroySync(EGLSync sync) {
    assert(sync);
    assert(syncs.contains(sync->id) && syncs.at(sync->id).get() == sync);
    if (sync->retainedAfterFlush && locked) ++trace->resetsUnderLock;
    if (!sync->alive) ++trace->duplicateDestroys;
    sync->alive = false;
    trace->Add("destroy:" + std::to_string(sync->id));
    if (sync->importedFD >= 0) {
      trace->Add("close:" + std::to_string(sync->importedFD));
    }
    return true;
  }
};

class GLContext : public std::enable_shared_from_this<GLContext> {
 public:
  enum Extension { EXT_semaphore, EXT_semaphore_fd };
  std::shared_ptr<EglDisplay> mEgl = std::make_shared<EglDisplay>();
  bool current = true;
  bool lost = false;
  bool destroyed = false;
  int semaphoreErrorAt = 0;
  int errorChecks = 0;
  bool IsExtensionSupported(Extension) const { return true; }
  bool MakeCurrent() {
    trace->Add("current");
    return current;
  }
  bool IsContextLost() const { return lost; }
  bool IsDestroyed() const { return destroyed; }
  void fFlush() {
    for (auto& [id, sync] : mEgl->syncs) {
      if (sync->alive && sync->importedFD < 0) sync->retainedAfterFlush = true;
    }
    trace->Add("flush");
  }
  void fFinish() { trace->Add("finish"); }
  void fGenSemaphoresEXT(unsigned count, GLuint* handle) {
    assert(count == 1);
    *handle = 1;
    trace->Add("semaphore-create");
  }
  void fImportSemaphoreFdEXT(GLuint handle, GLenum type, int fd) {
    assert(handle == 1 && type == LOCAL_GL_HANDLE_TYPE_OPAQUE_FD_EXT);
    trace->Add("semaphore-import:" + std::to_string(fd));
  }
  GLenum fGetError() {
    return ++errorChecks == semaphoreErrorAt ? 1 : LOCAL_GL_NO_ERROR;
  }
  void fWaitSemaphoreEXT(GLuint handle, unsigned buffers, const void* buffer,
                         unsigned textures, const GLuint* texture,
                         const GLenum* layout) {
    assert(handle == 1 && buffers == 0 && !buffer && textures == 1 &&
           *texture == 2);
    assert(*layout == LOCAL_GL_LAYOUT_COLOR_ATTACHMENT_EXT);
    if (locked) ++trace->waitsUnderLock;
    trace->Add("semaphore-wait");
  }
  void fDeleteSemaphoresEXT(unsigned count, const GLuint* handle) {
    assert(count == 1 && *handle == 1);
    trace->Add("semaphore-destroy");
  }
};
class GLContextEGL {
 public:
  static GLContext* Cast(GLContext* value) { return value; }
};
}  // namespace gl

namespace mozilla {
namespace gl = ::gl;
namespace gfx = ::gfx;
}  // namespace mozilla

struct CriticalNote {
  CriticalNote() { trace->Add("note"); }
  template <typename T>
  CriticalNote& operator<<(const T&) {
    return *this;
  }
};
#define gfxCriticalNoteOnce CriticalNote()
#define LOGDMABUF(...) ((void)0)
#define MOZ_ASSERT(value) assert(value)
#define MOZ_DIAGNOSTIC_ASSERT(value, ...) assert(value)
#define MOZ_ASSERT_UNREACHABLE(...) assert(false)
constexpr short POLLIN = 1;
struct pollfd {
  int fd;
  short events;
  short revents;
};
int poll(pollfd* data, int count, int timeout) {
  assert(count == 1 && data->events == POLLIN && timeout == 100);
  trace->Add("poll:" + std::to_string(data->fd));
  data->revents = trace->pollSucceeds ? POLLIN : 0;
  return trace->pollSucceeds ? 1 : 0;
}

class DMABufSurface {
 public:
#include "declarations.inc"
  Mutex mSurfaceLock;
  RefPtr<gl::GLContext> mGL;
  RefPtr<gfx::FileHandleWrapper> mSyncFd;
  RefPtr<gfx::FileHandleWrapper> mSemaphoreFd;
  bool mSemaphoreFdIsSyncFd = false;
  void ReleaseTextures() {
    trace->Add("release-textures");
    mGL = nullptr;
  }
};

#include "methods.inc"

#ifdef HAS_RETAINED_FENCE
static_assert(!std::is_copy_constructible_v<DMABufSurface::ProducerFence>);
static_assert(!std::is_copy_assignable_v<DMABufSurface::ProducerFence>);
static_assert(!std::is_move_constructible_v<DMABufSurface::ProducerFence>);
static_assert(!std::is_move_assignable_v<DMABufSurface::ProducerFence>);
#endif

class SharedSurface_DMABUF {
 public:
  struct {
    RefPtr<gl::GLContext> gl;
  } mDesc;
  const std::shared_ptr<DMABufSurface> mSurface;
#ifdef HAS_RETAINED_FENCE
  DMABufSurface::ProducerFence mProducerFence;
#endif
  explicit SharedSurface_DMABUF(const RefPtr<gl::GLContext>& gl)
      : mDesc{gl}, mSurface(std::make_shared<DMABufSurface>()) {
    mSurface->mGL = gl;
  }
  ~SharedSurface_DMABUF();
  void ProducerReleaseImpl();
  void WaitForBufferOwnership();
};

#include "shared.inc"

static unsigned cases = 0;
static unsigned failures = 0;
template <typename F>
void Run(const char* name, F&& function) {
  Trace state;
  trace = &state;
  {
    RefPtr<gl::GLContext> context = new gl::GLContext();
    function(state, context);
  }
  state.Check(state.waitsUnderLock == 0, "no wait under surface mutex");
  state.Check(state.resetsUnderLock == 0,
              "no retained destruction under mutex");
  state.Check(state.duplicateDestroys == 0, "no double sync destruction");
  assert(locked == 0);
  ++cases;
  failures += state.failures;
  std::cout << name << ": failures=" << state.failures << '\n';
}

int main() {
  for (bool native : {false, true}) {
    Run("both fence extensions independently required",
        [native](auto& log, auto& gl) {
          SharedSurface_DMABUF owner(gl);
          gl->mEgl->nativeExtension = !native;
          gl->mEgl->fenceExtension = native;
          owner.ProducerReleaseImpl();
          owner.WaitForBufferOwnership();
          log.Check(log.calls == std::vector<std::string>{"current", "finish"},
                    "one missing extension retains finish fallback");
        });
  }
  Run("sync-FD semaphore keeps its double-clone import path", [](auto& log,
                                                                 auto& gl) {
    DMABufSurface surface;
    surface.mGL = gl;
    surface.SetSemaphoreFd(70, true);
    surface.MaybeSemaphoreWait(2);
    const std::vector<std::string> expected = {
        "clone:70",  "clone:10", "import:1", "wait:1",
        "destroy:1", "close:11", "close:10", "close:70"};
    log.Check(log.calls == expected, "sync-FD semaphore sequence unchanged");
    surface.MaybeSemaphoreWait(2);
    log.Check(log.calls == expected, "semaphore consumed exactly once");
  });
  Run("sync-FD semaphore import failure", [](auto& log, auto& gl) {
    DMABufSurface surface;
    surface.mGL = gl;
    gl->mEgl->importFails = true;
    log.pollSucceeds = false;
    surface.SetSemaphoreFd(70, true);
    surface.MaybeSemaphoreWait(2);
    const std::vector<std::string> expected = {
        "clone:70", "clone:10", "import-fail", "note",    "poll:11",
        "note",     "close:11", "close:10",    "close:70"};
    log.Check(log.calls == expected, "sync-FD semaphore failure unchanged");
  });
  Run("sync-FD semaphore missing extension", [](auto& log, auto& gl) {
    DMABufSurface surface;
    surface.mGL = gl;
    gl->mEgl->extensions = false;
    surface.SetSemaphoreFd(70, true);
    surface.MaybeSemaphoreWait(2);
    log.Check(log.calls ==
                  std::vector<std::string>{"clone:70", "close:10", "close:70"},
              "unsupported semaphore follows old path");
  });
  for (int errorAt = 0; errorAt < 3; ++errorAt) {
    Run("opaque GL semaphore controls", [errorAt](auto& log, auto& gl) {
      DMABufSurface surface;
      surface.mGL = gl;
      gl->semaphoreErrorAt = errorAt;
      surface.SetSemaphoreFd(70);
      surface.MaybeSemaphoreWait(2);
      std::vector<std::string> expected = {"clone:70", "semaphore-create",
                                           "semaphore-import:10"};
      if (errorAt == 1) {
        expected.push_back("note");
      } else {
        expected.push_back("semaphore-wait");
        if (errorAt == 2) expected.push_back("note");
        expected.push_back("semaphore-destroy");
      }
      expected.push_back("close:70");
      log.Check(log.calls == expected, "opaque semaphore ledger unchanged");
    });
  }
  Run("empty state and missing context", [](auto& log, auto& gl) {
    DMABufSurface surface;
    surface.FenceWait();
    surface.FenceSet();
    log.Check(log.calls == std::vector<std::string>{"note"},
              "empty wait is inert and missing release context reports");
    surface.mSyncFd = new gfx::FileHandleWrapper(UniqueFileHandle(80));
    surface.FenceWait();
    log.Check(log.calls == std::vector<std::string>{"note", "note"},
              "missing wait context preserves FD without EGL work");
    log.Check(surface.mSyncFd->GetHandle() == 80, "pending FD retained");
    surface.FenceWait(gl);
    const std::vector<std::string> expected = {
        "note",   "note",      "clone:80", "import:1",
        "wait:1", "destroy:1", "close:10", "close:80"};
    log.Check(log.calls == expected,
              "explicit context follows old import path");
  });
  for (int failure = 0; failure < 7; ++failure) {
    Run("default release and wait error ledger", [failure](auto& log,
                                                           auto& gl) {
      DMABufSurface surface;
      surface.mGL = gl;
      switch (failure) {
        case 0:
          gl->mEgl->extensions = false;
          break;
        case 1:
          gl->mEgl->createFails = true;
          break;
        case 2:
          gl->mEgl->exportFails = true;
          break;
        case 3:
          gl->current = false;
          break;
        case 4:
          gl->lost = true;
          break;
        case 5:
          gl->destroyed = true;
          break;
        case 6:
          gl->mEgl->waitFails = true;
          break;
      }
      surface.FenceSet();
      surface.FenceWait();
      std::vector<std::string> expected;
      if (failure == 0) {
        expected = {"current", "finish"};
      } else if (failure == 1) {
        expected = {"current", "create-fail", "finish"};
      } else if (failure == 2) {
        expected = {"current",  "create:1", "export:1", "destroy:1", "flush",
                    "clone:-1", "import:2", "wait:2",   "destroy:2"};
      } else {
        expected = {"current",   "create:1", "export:1", "destroy:1",
                    "flush",     "clone:10", "import:2", "wait:2",
                    "destroy:2", "close:11", "close:10"};
      }
      log.Check(log.calls == expected, "default failure behavior unchanged");
    });
  }
  Run("local reuse waits original sync", [](auto& log, auto& gl) {
    SharedSurface_DMABUF owner(gl);
    owner.ProducerReleaseImpl();
    log.Check(log.Count("destroy:") == 0, "producer sync retained until reuse");
    RefPtr<gfx::FileHandleWrapper> exported = owner.mSurface->mSyncFd;
    owner.WaitForBufferOwnership();
    log.Check(log.Count("import:") == 0, "local reuse does not import");
    log.Check(log.Count("clone:") == 0, "local reuse does not clone");
    log.Check(log.Count("wait:1") == 1, "wait original sync");
    log.Check(log.Count("destroy:1") == 1, "destroy original sync once");
    log.Check(log.Count("flush") == 1, "producer still flushes");
    log.Check(log.Count("close:") == 0,
              "published FD still held independently");
    auto before = log.calls;
    owner.WaitForBufferOwnership();
    log.Check(log.calls == before, "second wait has no work");
  });
  Run("legacy no-holder sequence", [](auto& log, auto& gl) {
    DMABufSurface surface;
    surface.mGL = gl;
    surface.FenceSet();
    surface.FenceWait();
    const std::vector<std::string> expected = {
        "current",  "create:1", "export:1",  "destroy:1", "flush",   "clone:10",
        "import:2", "wait:2",   "destroy:2", "close:11",  "close:10"};
    log.Check(log.calls == expected,
              "no-holder full operation ledger unchanged");
  });
  Run("replacement releases previous generation", [](auto& log, auto& gl) {
    SharedSurface_DMABUF owner(gl);
    owner.ProducerReleaseImpl();
    owner.ProducerReleaseImpl();
    log.Check(log.Count("destroy:1") == 1, "old generation destroyed");
    log.Check(log.Count("destroy:2") == 0,
              "new generation not destroyed early");
    owner.WaitForBufferOwnership();
    log.Check(log.Count("wait:2") == 1, "new original sync waited");
    log.Check(log.Count("import:") == 0, "replacement has no reconstruction");
  });
  Run("foreign wrapper never uses old generation", [](auto& log, auto& gl) {
    SharedSurface_DMABUF owner(gl);
    owner.ProducerReleaseImpl();
    owner.mSurface->mSyncFd = new gfx::FileHandleWrapper(UniqueFileHandle(50));
    owner.WaitForBufferOwnership();
    log.Check(log.Count("clone:50") == 1, "foreign FD imported");
    log.Check(log.Count("wait:1") == 0, "old sync not used for new wrapper");
    log.Check(log.Count("destroy:1") == 1, "old sync released once");
  });
  Run("new wrapper with same integer is not authority", [](auto& log,
                                                           auto& gl) {
    // Corrupt ownership injection tests authority, not valid OS FD lifetime.
    SharedSurface_DMABUF owner(gl);
    owner.ProducerReleaseImpl();
    auto retained = owner.mSurface->mSyncFd;
    owner.mSurface->mSyncFd =
        new gfx::FileHandleWrapper(UniqueFileHandle(retained->GetHandle()));
    owner.WaitForBufferOwnership();
    log.Check(log.Count("clone:") == 1, "wrapper identity not FD number");
    log.Check(log.Count("wait:1") == 0, "aliased integer cannot certify reuse");
  });
  Run("different display rejects retained sync", [](auto& log, auto& gl) {
    SharedSurface_DMABUF owner(gl);
    owner.ProducerReleaseImpl();
    auto first = gl->mEgl;
    gl->mEgl = std::make_shared<gl::EglDisplay>();
    owner.WaitForBufferOwnership();
    log.Check(log.Count("import:") == 1, "different display falls back");
    log.Check(!first->syncs[1]->alive, "destroy with creating display");
  });
  Run("failed owner MakeCurrent still destroys retained sync",
      [](auto& log, auto& gl) {
        {
          SharedSurface_DMABUF owner(gl);
          owner.ProducerReleaseImpl();
          log.Check(log.Count("destroy:") == 0,
                    "sync alive until owner destruction");
          gl->current = false;
        }
        log.Check(log.Count("destroy:1") == 1,
                  "early-return destructor releases sync");
        log.Check(log.Count("wait:") == 0, "destructor does not wait");
        log.Check(log.Count("current") == 2,
                  "destruction adds no hidden MakeCurrent");
      });
  Run("missing wait context keeps FD but releases holder", [](auto& log,
                                                              auto& gl) {
    SharedSurface_DMABUF owner(gl);
    owner.ProducerReleaseImpl();
    auto exported = owner.mSurface->mSyncFd;
    owner.mSurface->mGL = nullptr;
    owner.WaitForBufferOwnership();
    log.Check(owner.mSurface->mSyncFd == exported, "missing GL keeps FD");
    log.Check(log.Count("destroy:1") == 1, "invalid holder released");
    log.Check(log.Count("wait:") == 0, "no wait without context");
    owner.mSurface->mGL = gl;
    owner.WaitForBufferOwnership();
    log.Check(log.Count("import:") == 1, "restored context uses FD fallback");
  });
  Run("lost and destroyed contexts cannot use shortcut",
      [](auto& log, auto& gl) {
        SharedSurface_DMABUF owner(gl);
        owner.ProducerReleaseImpl();
        gl->lost = true;
        owner.WaitForBufferOwnership();
        gl->lost = false;
        owner.ProducerReleaseImpl();
        gl->destroyed = true;
        owner.WaitForBufferOwnership();
        log.Check(log.Count("import:") == 2, "context loss uses old fallback");
      });
  Run("retained wait error falls back without losing exported dependency",
      [](auto& log, auto& gl) {
        SharedSurface_DMABUF owner(gl);
        owner.ProducerReleaseImpl();
        gl->mEgl->waitFails = true;
        owner.WaitForBufferOwnership();
        log.Check(log.Count("wait:") == 2, "error retries original FD path");
        log.Check(log.Count("clone:") == 1, "fallback clones still-live FD");
        log.Check(log.Count("destroy:1") == 1,
                  "retained failure destroyed once");
      });
  for (int failure = 0; failure < 4; ++failure) {
    Run("release failure cannot retain sync", [failure](auto& log, auto& gl) {
      SharedSurface_DMABUF owner(gl);
      switch (failure) {
        case 0:
          gl->mEgl->extensions = false;
          break;
        case 1:
          gl->mEgl->createFails = true;
          break;
        case 2:
          gl->mEgl->exportFails = true;
          break;
        case 3:
          gl->current = false;
          break;
      }
      owner.ProducerReleaseImpl();
      if (failure < 2) {
        log.Check(log.Count("finish") == 1, "old finish fallback kept");
      } else {
        log.Check(log.Count("destroy:") == 1, "invalid release not retained");
        log.Check(log.Count("flush") == 1, "old flush kept");
        owner.WaitForBufferOwnership();
        log.Check(log.Count("import:") == 1,
                  "invalid release follows FD route");
      }
    });
  }
  for (int failure = 0; failure < 6; ++failure) {
    Run("failed replacement cannot revive an older fence", [failure](auto& log,
                                                                     auto& gl) {
      SharedSurface_DMABUF owner(gl);
      owner.ProducerReleaseImpl();
      switch (failure) {
        case 0:
          gl->mEgl->extensions = false;
          break;
        case 1:
          gl->mEgl->createFails = true;
          break;
        case 2:
          gl->mEgl->exportFails = true;
          break;
        case 3:
          gl->current = false;
          break;
        case 4:
          gl->lost = true;
          break;
        case 5:
          gl->destroyed = true;
          break;
      }
      owner.ProducerReleaseImpl();
      log.Check(log.Count("destroy:1") == 1, "old generation reset on release");
      gl->mEgl->extensions = true;
      gl->mEgl->createFails = false;
      gl->mEgl->exportFails = false;
      gl->current = true;
      gl->lost = false;
      gl->destroyed = false;
      owner.WaitForBufferOwnership();
      log.Check(log.Count("import:") == 1,
                "recovery cannot revive old authority");
      log.Check(log.Count("wait:1") == 0, "old generation never waited");
      owner.ProducerReleaseImpl();
      owner.WaitForBufferOwnership();
      log.Check(log.Count("import:") == 1,
                "new valid generation recovers reuse");
    });
  }
  Run("repeated published references survive local consumption", [](auto& log,
                                                                    auto& gl) {
    RefPtr<gfx::FileHandleWrapper> first;
    RefPtr<gfx::FileHandleWrapper> second;
    {
      SharedSurface_DMABUF owner(gl);
      owner.ProducerReleaseImpl();
      first = owner.mSurface->mSyncFd;
      second = owner.mSurface->mSyncFd;
      owner.WaitForBufferOwnership();
    }
    log.Check(log.Count("close:10") == 0, "published refs outlive owner");
    first = nullptr;
    log.Check(log.Count("close:10") == 0, "last published ref still owns FD");
    second = nullptr;
    log.Check(log.Count("close:10") == 1, "last published ref closes FD once");
  });
  Run("retained wait and import failure keep finite poll", [](auto& log,
                                                              auto& gl) {
    SharedSurface_DMABUF owner(gl);
    owner.ProducerReleaseImpl();
    gl->mEgl->waitFails = true;
    gl->mEgl->importFails = true;
    log.pollSucceeds = false;
    owner.WaitForBufferOwnership();
    log.Check(log.Count("wait:1") == 1, "retained wait attempted");
    log.Check(log.Count("poll:") == 1, "old finite poll fallback kept");
    log.Check(log.Count("note") == 2, "both failures reported");
    log.Check(log.Count("destroy:1") == 1, "holder released despite failures");
  });
  Run("many idle owners release all generations", [](auto& log, auto& gl) {
    std::vector<std::unique_ptr<SharedSurface_DMABUF>> owners;
    for (int index = 0; index < 64; ++index) {
      auto owner = std::make_unique<SharedSurface_DMABUF>(gl);
      owner->ProducerReleaseImpl();
      owner->ProducerReleaseImpl();
      owners.push_back(std::move(owner));
    }
    log.Check(log.Count("destroy:") == 64, "one retained fence per idle owner");
    gl->current = false;
    owners.clear();
    log.Check(log.Count("destroy:") == 128, "all idle fences released");
    log.Check(log.Count("close:") == 128, "all exported FDs released");
    log.Check(log.Count("wait:") == 0, "teardown does not add waits");
  });
  Run("missing release context cannot leave old holder",
      [](auto& log, auto& gl) {
        SharedSurface_DMABUF owner(gl);
        owner.ProducerReleaseImpl();
        owner.mSurface->mGL = nullptr;
        owner.ProducerReleaseImpl();
        log.Check(log.Count("destroy:1") == 1,
                  "failed release invalidates old holder");
        owner.mSurface->mGL = gl;
        owner.WaitForBufferOwnership();
        log.Check(log.Count("import:") == 1,
                  "old FD cannot regain holder authority");
      });
  Run("external consumption invalidates holder on next empty wait",
      [](auto& log, auto& gl) {
        SharedSurface_DMABUF owner(gl);
        owner.ProducerReleaseImpl();
        owner.mSurface->FenceWait();
        owner.WaitForBufferOwnership();
        log.Check(log.Count("destroy:1") == 1,
                  "empty wait releases stale holder");
        log.Check(log.Count("wait:") == 1, "empty wait does not wait again");
      });
  for (bool success : {false, true}) {
    Run("import failure preserves finite poll", [success](auto& log, auto& gl) {
      DMABufSurface surface;
      surface.mGL = gl;
      surface.FenceSet();
      gl->mEgl->importFails = true;
      log.pollSucceeds = success;
      surface.FenceWait();
      log.Check(log.Count("poll:") == 1, "one finite poll after failed import");
      log.Check(log.Count("wait:") == 0, "no wait on failed import");
      log.Check(log.Count("close:") == 2, "clone and original FD released");
      log.Check(log.Count("note") == (success ? 1u : 2u),
                "poll failure reported");
    });
  }
  Run("clone failure preserves existing invalid-FD import behavior",
      [](auto& log, auto& gl) {
        DMABufSurface surface;
        surface.mGL = gl;
        surface.FenceSet();
        log.cloneFails = true;
        surface.FenceWait();
        log.Check(log.Count("import:") == 1,
                  "baseline still calls import with -1");
        log.Check(log.Count("close:") == 1, "no false clone ownership");
      });
  Run("retention released before final display reference", [](auto& log,
                                                              auto& gl) {
    auto owner = std::make_unique<SharedSurface_DMABUF>(gl);
    owner->ProducerReleaseImpl();
    gl = nullptr;
    owner.reset();
    auto destroy = std::find(log.calls.begin(), log.calls.end(), "destroy:1");
    auto display =
        std::find(log.calls.begin(), log.calls.end(), "display-destroy");
    log.Check(destroy < display && display != log.calls.end(),
              "sync before display");
  });
  std::cout << "cases=" << cases << " failures=" << failures << '\n';
  return failures ? 1 : 0;
}
