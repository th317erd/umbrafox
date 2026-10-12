/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <algorithm>
#include <cassert>
#include <cstdint>
#include <functional>
#include <iostream>
#include <memory>
#include <optional>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

// Native cache/translation methods are compiled below; IPC, GL and ownership
// primitives are stand-ins. Real driver, pixel and Gecko lifetime gates are
// separate.
template <typename T>
class RefPtr {
 public:
  std::shared_ptr<T> ptr;
  RefPtr() = default;
  RefPtr(std::nullptr_t) {}
  RefPtr(T* value) {
    if (value) {
      ptr = std::dynamic_pointer_cast<T>(value->weak_from_this().lock());
      if (!ptr) {
        ptr.reset(value);
      }
    }
  }
  template <typename U>
  RefPtr(const RefPtr<U>& value) : ptr(value.ptr) {}
  T* get() const { return ptr.get(); }
  operator T*() const { return get(); }
  T* operator->() const { return get(); }
  RefPtr forget() { return std::exchange(*this, {}); }
};
template <typename T>
using already_AddRefed = RefPtr<T>;
template <typename T>
using Maybe = std::optional<T>;
template <typename T>
class WeakPtr {
  std::weak_ptr<T> ptr;

 public:
  WeakPtr& operator=(const RefPtr<T>& value) {
    ptr = value.ptr;
    return *this;
  }
  WeakPtr& operator=(std::nullptr_t) {
    ptr.reset();
    return *this;
  }
  T* get() const { return ptr.lock().get(); }
  operator T*() const { return get(); }
};
struct IntSize {
  int width = 0, height = 0;
  bool IsEmpty() const { return width <= 0 || height <= 0; }
  bool operator==(const IntSize&) const = default;
};
struct IntPoint {
  int x = 0, y = 0;
  bool operator==(const IntPoint&) const = default;
};
enum class SurfaceFormat {
  B8G8R8A8,
  R8G8B8A8,
  B8G8R8X8,
  R8G8B8X8,
  NV12,
  YUV420,
  P010,
  P016,
  UNKNOWN
};
enum class SurfaceType { WEBGL, DATA };
namespace layers {
struct SurfaceDescriptorRemoteDecoderId {
  uint64_t mId = 0;
  bool IsValid() const { return mId != 0; }
  bool operator==(const SurfaceDescriptorRemoteDecoderId&) const = default;
};
struct SurfaceDescriptor {
  static constexpr int TSurfaceDescriptorDMABuf = 1;
  int tag = 1;
  int type() const { return tag; }
};
struct TextureHost : std::enable_shared_from_this<TextureHost> {
  IntSize size{1920, 1080};
  SurfaceFormat format = SurfaceFormat::NV12;
  SurfaceDescriptor desc;
  unsigned descriptorReads = 0;
  mutable unsigned descriptorBorrows = 0;
  bool lendDescriptor = false;
  const SurfaceDescriptor* BorrowSurfaceDescriptor() const {
    ++descriptorBorrows;
    return lendDescriptor ? &desc : nullptr;
  }
  SurfaceDescriptor GetSurfaceDescriptor() {
    ++descriptorReads;
    return desc;
  }
  IntSize GetSize() const { return size; }
  SurfaceFormat GetFormat() const { return format; }
};
}  // namespace layers
namespace gfx {
using ::IntSize;
using ::SurfaceFormat;
struct SharedContextWebgl;
struct TextureHandle;
struct SourceSurface : std::enable_shared_from_this<SourceSurface> {
  virtual ~SourceSurface() = default;
  virtual SurfaceType GetType() const { return SurfaceType::DATA; }
  virtual IntSize GetSize() const { return {}; }
  virtual SurfaceFormat GetFormat() const { return SurfaceFormat::UNKNOWN; }
};
struct TextureHandle : std::enable_shared_from_this<TextureHandle> {
  IntSize size;
  SurfaceFormat format;
  IntPoint offset;
  bool valid = true, listed = true;
  WeakPtr<SourceSurface> owner;
  explicit TextureHandle(IntSize aSize, SurfaceFormat aFormat)
      : size(aSize), format(aFormat) {}
  bool IsValid() const { return valid; }
  IntSize GetSize() const { return size; }
  SurfaceFormat GetFormat() const { return format; }
  IntPoint GetSamplingOffset() const { return offset; }
  RefPtr<SourceSurface> GetSurface() const { return owner.get(); }
  void SetSurface(SourceSurface* value) {
    owner = RefPtr<SourceSurface>(value);
  }
  void ClearSurface() { owner = nullptr; }
  void remove() {
    assert(listed);
    listed = false;
  }
};
struct SourceSurfaceWebgl : SourceSurface {
  SharedContextWebgl* mSharedContext;
  RefPtr<TextureHandle> mHandle;
  bool mData = false, mReadBuffer = false;
  explicit SourceSurfaceWebgl(SharedContextWebgl* context)
      : mSharedContext(context) {}
  ~SourceSurfaceWebgl() override {
    if (mHandle) mHandle->ClearSurface();
  }
  SurfaceType GetType() const override { return SurfaceType::WEBGL; }
  IntSize GetSize() const override { return mHandle->GetSize(); }
  SurfaceFormat GetFormat() const override { return mHandle->GetFormat(); }
  void SetHandle(TextureHandle* handle) {
    assert(!mHandle);
    mHandle = handle;
    handle->SetSurface(this);
  }
};
struct SharedContextWebgl : std::enable_shared_from_this<SharedContextWebgl> {
  struct Handles {
    std::vector<RefPtr<TextureHandle>> values;
    unsigned touches = 0;
    void insertFront(TextureHandle* handle) {
      RefPtr<TextureHandle> keep = handle;
      values.erase(std::remove_if(values.begin(), values.end(),
                                  [&](const auto& value) {
                                    return value.get() == handle;
                                  }),
                   values.end());
      values.insert(values.begin(), keep);
      handle->listed = true;
      ++touches;
    }
  } mTextureHandles;
  bool lost = false, failImport = false, mShouldClearCaches = false;
  static inline bool failCreate = false;
  static RefPtr<SharedContextWebgl> Create() {
    return failCreate ? nullptr : new SharedContextWebgl;
  }
  unsigned conversions = 0;
  bool IsContextLost() const { return lost; }
  void EnterTlsScope() {}
  void ExitTlsScope() {}
  void ClearVideoSurfaceCache();
#include "reuse-fields.inc"
  void SetTarget(TextureHandle* aHandle) {
    (void)aHandle;
#include "target-guard.inc"
  }
  void UploadSurfaceToHandle(TextureHandle* aHandle) {
    (void)aHandle;
#include "upload-guard.inc"
  }
  void BindScratchFramebuffer(TextureHandle* aHandle) {
    (void)aHandle;
#include "scratch-guard.inc"
  }
  already_AddRefed<SourceSurface> ImportSurfaceDescriptor(
      const layers::SurfaceDescriptor&, const IntSize& size,
      SurfaceFormat format, bool allowFallback) {
    assert(allowFallback);
    ClearVideoSurfaceCache();
    ++conversions;
    if (lost || failImport) return nullptr;
    RefPtr<TextureHandle> handle = new TextureHandle(size, format);
    mTextureHandles.values.push_back(handle);
    RefPtr<SourceSurfaceWebgl> surface = new SourceSurfaceWebgl(this);
    surface->SetHandle(handle);
    return surface;
  }
#ifdef HAS_REUSE
  already_AddRefed<SourceSurface> ImportVideoSurfaceDescriptor(
      const layers::SurfaceDescriptor&, const IntSize&, SurfaceFormat,
      layers::TextureHost*, layers::SurfaceDescriptorRemoteDecoderId);
#endif
};
#include "reuse-methods.inc"
}  // namespace gfx

template <typename F>
struct ScopeExit {
  F function;
  ~ScopeExit() { function(); }
};
template <typename F>
auto MakeScopeExit(F function) {
  return ScopeExit<F>{function};
}
template <typename T>
struct AutoRestore {
  T& reference;
  T value;
  explicit AutoRestore(T& target) : reference(target), value(target) {}
  ~AutoRestore() { reference = value; }
};
struct TimeStamp {
  static inline double elapsed = 0;
  static TimeStamp Now() { return {}; }
  TimeStamp operator-(TimeStamp) const { return {}; }
  double ToMilliseconds() const { return elapsed; }
};
#define MOZ_ASSERT(...) assert((__VA_ARGS__))
#define MOZ_DIAGNOSTIC_ASSERT_IF(condition, assertion) \
  assert(!(condition) || (assertion))
#define gfxWarning() std::cerr
#define gfxCriticalNote std::cerr
#define gfxCriticalNoteOnce std::cerr
enum class State { Failed, Processing, Paused };
enum class EventType { INVALID, DRAW };
std::ostream& operator<<(std::ostream& stream, EventType type) {
  return stream << static_cast<int>(type);
}
struct Reader {
  bool valid = true;
  bool good() const { return valid; }
};
struct CanvasTranslator;
struct RecordedEvent {
  static inline std::function<bool(CanvasTranslator*)> action;
  int GetType() const { return 1; }
  bool PlayEvent(CanvasTranslator* translator) { return action(translator); }
  template <typename F>
  static bool DoWithEventFromReader(Reader&, EventType, F callback) {
    RecordedEvent event;
    return callback(&event);
  }
};
using namespace layers;
struct CanvasTranslator {
  struct RemoteOwner {
    void ClearRecycledTextures() {}
  };
  struct Header {
    State readerState = State::Processing;
    int64_t processedCount = 0;
  } header;
  Header* mHeader = &header;
  RefPtr<gfx::SharedContextWebgl> mSharedContext = new gfx::SharedContextWebgl;
  static inline RefPtr<gfx::SharedContextWebgl> sSharedContext;
  RemoteOwner* mRemoteTextureOwner = nullptr;
  Reader mCurrentMemReader;
  int64_t mFlushCheckpoint = 0;
  bool mIPDLClosed = false, mIsTranslating = false, pending = false,
       pause = false, ensure = true;
  unsigned events = 0;
  bool IsInTaskQueue() const { return true; }
  bool HasPendingEvent() const { return true; }
  bool EnsureSharedContextWebgl();
  void ForceDrawTargetWebglFallback() {}
  void BlockCanvas() {}
  bool HandleExtensionEvent(EventType) { return false; }
  bool UsePendingCanvasTranslatorEvents() const { return pending; }
  bool PauseUntilSync() const { return pause; }
  void Flush() {}
  bool ReadNextEvent(EventType& event) {
    if (!events) return false;
    --events;
    event = EventType::DRAW;
    return true;
  }
  bool TranslateRecording();
  already_AddRefed<gfx::SourceSurface> GetZeroCopySurfaceFromDMABuf(
      TextureHost*
#ifdef HAS_REUSE
      ,
      SurfaceDescriptorRemoteDecoderId
#endif
  );
  RefPtr<gfx::SourceSurface> draw(TextureHost* host, uint64_t id = 1) {
#ifdef HAS_REUSE
    return GetZeroCopySurfaceFromDMABuf(host, {id});
#else
    (void)id;
    return GetZeroCopySurfaceFromDMABuf(host);
#endif
  }
};
#include "import.inc"
#include "translate.inc"
#include "ensure.inc"

static void check(bool value, const char* message) {
  if (!value) throw std::runtime_error(message);
}
static gfx::SourceSurfaceWebgl* webgl(
    const RefPtr<gfx::SourceSurface>& surface) {
  return static_cast<gfx::SourceSurfaceWebgl*>(surface.get());
}
int main() {
  unsigned tests = 0, failures = 0;
  auto test = [&](const char* name, auto body) {
    ++tests;
    try {
      body();
      std::cout << "PASS " << name << '\n';
    } catch (const std::exception& error) {
      ++failures;
      std::cout << "FAIL " << name << ": " << error.what() << '\n';
    }
  };
  test("four same-frame imports convert once and preserve live owner", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    auto first = translator.draw(host);
    bool sameOwner = true;
    for (unsigned i = 0; i < 3; ++i) {
      auto next = translator.draw(host);
      sameOwner = sameOwner && first.get() == next.get();
    }
    std::cout << "four-copy conversions="
              << translator.mSharedContext->conversions << '\n';
    check(translator.mSharedContext->conversions == 1, "conversion repeated");
    check(sameOwner, "live wrapper replaced");
    check(host->descriptorReads == 4, "host admission bypassed");
    check(webgl(first)->mHandle->GetSurface().get() == first.get(),
          "owner lost");
    check(translator.mSharedContext->mTextureHandles.touches == 3,
          "MRU not refreshed");
  });
  for (bool lend : {false, true}) {
    test(
        "descriptor admission borrows without copying or keeps owning fallback",
        [=] {
          CanvasTranslator translator;
          translator.mIsTranslating = true;
          RefPtr<TextureHost> host = new TextureHost;
          host->lendDescriptor = lend;
          auto first = translator.draw(host);
          check(!!first, "first import failed");
          for (unsigned i = 0; i < 3; ++i) {
            check(translator.draw(host).get() == first.get(),
                  "borrow changed cached surface");
          }
          check(host->descriptorReads == (lend ? 0u : 4u),
                "unexpected owning descriptor copies");
          check(host->descriptorBorrows == 4,
                "descriptor admission was not checked each draw");
          check(translator.mSharedContext->conversions == 1,
                "borrow changed cache conversions");
          auto next = translator.draw(host, 2);
          check(next && next.get() != first.get(), "new frame was cached");
          check(host->descriptorReads == (lend ? 0u : 5u),
                "cache miss copied a borrowed descriptor");
        });
    for (unsigned mode = 0; mode < 5; ++mode) {
      test("borrow and owning admission reject malformed or failed imports",
           [=] {
             CanvasTranslator translator;
             translator.mIsTranslating = true;
             RefPtr<TextureHost> host = new TextureHost;
             host->lendDescriptor = lend;
             auto first = translator.draw(host);
             check(!!first, "first import failed");
             if (mode == 0) host->desc.tag = 0;
             if (mode == 1) host->size = {};
             if (mode == 2) host->format = SurfaceFormat::UNKNOWN;
             if (mode == 3) translator.mSharedContext->failImport = true;
             if (mode == 4) {
               translator.mSharedContext->lost = true;
               gfx::SharedContextWebgl::failCreate = true;
             }
             auto failed = translator.draw(host, mode == 3 ? 2 : 1);
             gfx::SharedContextWebgl::failCreate = false;
             check(!failed, "invalid descriptor or context accepted");
             check(host.ptr.use_count() == 1,
                   "failed admission retained cached host");
             check(host->descriptorReads == (lend ? 0u : 2u),
                   "unexpected descriptor copy on failure");
           });
    }
  }
  test("borrowed descriptor type remains checked on a cached frame", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    host->lendDescriptor = true;
    auto first = translator.draw(host);
    host->desc.tag = 0;
    check(!translator.draw(host), "borrowed type check skipped on cache hit");
    host->desc.tag = 1;
    auto recovered = translator.draw(host);
    check(recovered && recovered.get() != first.get(), "stale cache recovered");
    check(host->descriptorReads == 0, "borrowed recovery copied descriptor");
  });
  test("borrow support may change without bypassing admission", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    host->lendDescriptor = true;
    auto first = translator.draw(host);
    host->lendDescriptor = false;
    check(translator.draw(host).get() == first.get(), "fallback lost cache");
    host->lendDescriptor = true;
    check(translator.draw(host).get() == first.get(), "borrow lost cache");
    check(host->descriptorReads == 1 && host->descriptorBorrows == 3,
          "fallback copied incorrectly");
    check(!translator.draw(nullptr), "null host admitted");
    check(host.ptr.use_count() == 1, "null host failed to clear cache");
  });
  test("dead wrapper reuses valid handle without retaining surface", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    auto first = translator.draw(host);
    auto handle = webgl(first)->mHandle;
    WeakPtr<gfx::SourceSurface> weak;
    weak = first;
    first = nullptr;
    check(!weak.get(), "cache retained surface");
    auto second = translator.draw(host);
    check(webgl(second)->mHandle.get() == handle.get(),
          "valid handle not reused");
    check(handle->GetSurface().get() == second.get(), "new owner not linked");
  });
  test("new frame same host and new host same ID are misses", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> a = new TextureHost, b = new TextureHost;
    auto first = translator.draw(a, 1);
    auto second = translator.draw(a, 2);
    auto third = translator.draw(b, 2);
    check(first.get() != second.get() && second.get() != third.get(),
          "frame alias");
    check(translator.mSharedContext->conversions == 3, "miss count");
  });
  test("invalid IDs and imports outside translation do not reuse", [] {
    CanvasTranslator translator;
    RefPtr<TextureHost> host = new TextureHost;
    auto first = translator.draw(host), second = translator.draw(host);
    translator.mIsTranslating = true;
    auto third = translator.draw(host, 0), fourth = translator.draw(host, 0);
    check(translator.mSharedContext->conversions == 4, "unscoped reuse");
  });
  for (unsigned mode = 0; mode < 7; ++mode)
    test("changed texture metadata or ownership misses", [=] {
      CanvasTranslator translator;
      translator.mIsTranslating = true;
      RefPtr<TextureHost> host = new TextureHost;
      auto first = translator.draw(host);
      auto handle = webgl(first)->mHandle;
      switch (mode) {
        case 0:
          handle->valid = false;
          break;
        case 1:
          handle->offset = {1, 0};
          break;
        case 2:
          handle->size = {320, 180};
          break;
        case 3:
          handle->format = SurfaceFormat::UNKNOWN;
          break;
        case 4:
          webgl(first)->mSharedContext = nullptr;
          break;
        case 5:
          webgl(first)->mData = true;
          break;
        case 6:
          webgl(first)->mReadBuffer = true;
          break;
      }
      auto second = translator.draw(host);
      check(second && second.get() != first.get(), "unsafe hit");
      check(translator.mSharedContext->conversions == 2, "missing conversion");
    });
  test("weak cache does not retain evicted storage", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    auto first = translator.draw(host);
    WeakPtr<gfx::TextureHandle> weak;
    weak = webgl(first)->mHandle;
    first = nullptr;
    translator.mSharedContext->mTextureHandles.values.clear();
    check(!weak.get(), "cache retained handle");
    check(!!translator.draw(host), "expired handle not recovered");
    check(translator.mSharedContext->conversions == 2, "expired handle reused");
  });
  test("failed upload, lost context and memory pressure never hit", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    auto first = translator.draw(host);
    translator.mSharedContext->lost = true;
    gfx::SharedContextWebgl::failCreate = true;
    check(!translator.draw(host), "lost context hit");
    gfx::SharedContextWebgl::failCreate = false;
    translator.mSharedContext = new gfx::SharedContextWebgl;
    translator.mSharedContext->failImport = true;
    check(!translator.draw(host), "failed upload hit");
    translator.mSharedContext->failImport = false;
    auto second = translator.draw(host);
    translator.mSharedContext->mShouldClearCaches = true;
    auto third = translator.draw(host), fourth = translator.draw(host);
    check(third.get() != second.get() && fourth.get() != third.get(),
          "pressure retained entry");
  });
  test("unsupported admission discards previous entry", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    auto first = translator.draw(host);
    host->desc.tag = 0;
    check(!translator.draw(host), "unsupported accepted");
    host->desc.tag = 1;
    auto second = translator.draw(host);
    check(first.get() != second.get(), "failed admission retained entry");
  });
  for (unsigned mode = 0; mode < 3; ++mode)
    test("actual texture-write guards invalidate only the written entry", [=] {
      CanvasTranslator translator;
      translator.mIsTranslating = true;
      RefPtr<TextureHost> host = new TextureHost;
      auto first = translator.draw(host);
      auto handle = webgl(first)->mHandle;
      RefPtr<gfx::TextureHandle> other =
          new gfx::TextureHandle({8, 8}, SurfaceFormat::B8G8R8A8);
      auto write = [&](gfx::TextureHandle* target) {
        switch (mode) {
          case 0:
            translator.mSharedContext->SetTarget(target);
            break;
          case 1:
            translator.mSharedContext->UploadSurfaceToHandle(target);
            break;
          case 2:
            translator.mSharedContext->BindScratchFramebuffer(target);
            break;
        }
      };
      write(other);
      check(translator.draw(host).get() == first.get(),
            "unrelated write lost cache");
      write(handle);
      check(translator.draw(host).get() != first.get(),
            "written pixels reused");
    });
  test("host key retained only until clear; generic import invalidates", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    auto first = translator.draw(host);
    check(host.ptr.use_count() == 2, "host identity not retained");
    translator.mSharedContext->ClearVideoSurfaceCache();
    check(host.ptr.use_count() == 1, "host identity retained after clear");
    auto second = translator.draw(host);
    auto generic = translator.mSharedContext->ImportSurfaceDescriptor(
        {}, host->size, SurfaceFormat::B8G8R8X8, true);
    auto third = translator.draw(host);
    check(second.get() != third.get(), "generic import left entry intact");
    check(translator.mSharedContext->conversions == 4, "generic path changed");
  });
  test("same-frame draws in actual translation loop share one conversion", [] {
    CanvasTranslator translator;
    RefPtr<TextureHost> host = new TextureHost;
    translator.events = 4;
    RecordedEvent::action = [&](CanvasTranslator* current) {
      check(!!current->draw(host), "draw failed");
      return true;
    };
    translator.TranslateRecording();
    check(translator.mSharedContext->conversions == 1, "batch did not reuse");
    check(host.ptr.use_count() == 1, "batch retained host");
    translator.events = 4;
    translator.TranslateRecording();
    check(translator.mSharedContext->conversions == 2,
          "cache escaped first batch");
  });
  test("different context and incorrect owner never reuse", [] {
    CanvasTranslator translator;
    translator.mIsTranslating = true;
    RefPtr<TextureHost> host = new TextureHost;
    auto first = translator.draw(host);
    RefPtr<gfx::SourceSurface> invalidOwner = new gfx::SourceSurface;
    webgl(first)->mHandle->SetSurface(invalidOwner);
    auto second = translator.draw(host);
    check(second.get() != first.get(), "incorrect owner accepted");
    check(webgl(first)->mHandle->GetSurface().get() == invalidOwner.get(),
          "live owner overwritten");
    translator.mSharedContext->ClearVideoSurfaceCache();
    translator.mSharedContext = new gfx::SharedContextWebgl;
    auto third = translator.draw(host);
    check(third.get() != second.get(), "old context reused");
  });
  test("new translator releases lost global context entry before replacement",
       [] {
         CanvasTranslator first;
         first.mIsTranslating = true;
         RefPtr<TextureHost> host = new TextureHost;
         first.draw(host);
         CanvasTranslator::sSharedContext = first.mSharedContext;
         first.mSharedContext->lost = true;
         CanvasTranslator second;
         second.mSharedContext = nullptr;
         check(second.EnsureSharedContextWebgl(),
               "replacement context unavailable");
         check(first.mSharedContext.get() != second.mSharedContext.get(),
               "lost context reused");
         check(host.ptr.use_count() == 1, "lost global context retained host");
         CanvasTranslator::sSharedContext = nullptr;
       });
  for (unsigned mode = 0; mode < 6; ++mode)
    test("translation exits release host key and batch state", [=] {
      CanvasTranslator translator;
      RefPtr<TextureHost> host = new TextureHost;
      translator.events = 1;
      translator.pause = mode == 1;
      translator.mFlushCheckpoint = mode == 2 ? 1 : 0;
      translator.pending = mode == 3;
      TimeStamp::elapsed = mode == 3 ? 101 : 0;
      if (mode == 5) {
        translator.mIsTranslating = true;
        translator.draw(host);
        translator.mIsTranslating = false;
        translator.header.readerState = State::Failed;
      }
      RecordedEvent::action = [&](CanvasTranslator* current) {
        auto surface = current->draw(host);
        check(!!surface, "draw failed");
        if (mode == 4) current->mCurrentMemReader.valid = false;
        return true;
      };
      translator.TranslateRecording();
      check(!translator.mIsTranslating, "batch state escaped");
      check(host.ptr.use_count() == 1, "host retained after batch");
    });
  test("nested translation invalidates outer entry without restoring it", [] {
    CanvasTranslator translator;
    RefPtr<TextureHost> host = new TextureHost;
    translator.events = 1;
    RecordedEvent::action = [&](CanvasTranslator* current) {
      auto first = current->draw(host);
      current->TranslateRecording();
      auto second = current->draw(host);
      check(first.get() != second.get(), "nested entry restored");
      check(current->mIsTranslating, "outer batch disabled");
      return true;
    };
    translator.TranslateRecording();
    check(host.ptr.use_count() == 1, "host retained after nested batch");
  });
  std::cout << "tests=" << tests << " failures=" << failures << '\n';
  return failures ? 1 : 0;
}
