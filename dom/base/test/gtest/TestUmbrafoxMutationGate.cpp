/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include <atomic>
#include <cstdio>

#include "UmbrafoxUserlandMutation.h"
#include "gtest/gtest.h"
#include "mozilla/BasePrincipal.h"
#include "mozilla/OriginAttributes.h"
#include "mozilla/Preferences.h"
#include "mozilla/ScopeExit.h"
#include "mozilla/StaticPrefs_umbrafox.h"
#include "mozilla/TimeStamp.h"
#include "mozilla/dom/Document.h"
#include "nsNetUtil.h"
#include "nsString.h"
#include "nsTextNode.h"

using namespace mozilla;
using mozilla::dom::UmbrafoxUserlandMutation;

namespace {

constexpr char kActivePref[] = "umbrafox.userlandScripts.active";

struct ActivePrefObservation {
  bool mExpected = false;
  uint32_t mCalls = 0;
};

void ObserveActivePref(const char* aPref, void* aData) {
  auto& observation = *static_cast<ActivePrefObservation*>(aData);
  EXPECT_STREQ(aPref, kActivePref);
  EXPECT_EQ(StaticPrefs::umbrafox_userlandScripts_active(),
            observation.mExpected);
  ++observation.mCalls;
}

already_AddRefed<nsTextNode> MakeMutationGateTarget() {
  nsCOMPtr<nsIURI> uri;
  MOZ_ALWAYS_SUCCEEDS(NS_NewURI(getter_AddRefs(uri), "data:text/html,"));
  RefPtr<BasePrincipal> principal =
      BasePrincipal::CreateContentPrincipal(uri, OriginAttributes());
  MOZ_RELEASE_ASSERT(principal);
  nsCOMPtr<dom::Document> document;
  MOZ_ALWAYS_SUCCEEDS(NS_NewDOMDocument(
      getter_AddRefs(document), u""_ns, u""_ns, nullptr, uri, uri, principal,
      dom::LoadedAsData::No, nullptr, DocumentFlavor::HTML));
  MOZ_RELEASE_ASSERT(document);
  return document->CreateTextNode(u"sample"_ns);
}

template <typename Reader>
double MeasureInactiveGate(Reader&& aReader) {
  constexpr uint32_t iterations = 1000000;
  uint32_t enabled = 0;
  const TimeStamp start = TimeStamp::Now();
  for (uint32_t index = 0; index < iterations; ++index) {
    enabled += aReader();
  }
  const double elapsed = (TimeStamp::Now() - start).ToMilliseconds();
  EXPECT_EQ(enabled, 0u);
  return elapsed * 1000000 / iterations;
}

}  // namespace

TEST(UmbrafoxMutationGate, InactiveChildDecision)
{
  ASSERT_FALSE(Preferences::HasUserValue(kActivePref));
  const auto restore =
      MakeScopeExit([] { Preferences::ClearUser(kActivePref); });
  ASSERT_EQ(Preferences::SetBool(kActivePref, false), NS_OK);
  const RefPtr<nsTextNode> target = MakeMutationGateTarget();
  EXPECT_FALSE(UmbrafoxUserlandMutation::ShouldDispatchMutation(nullptr));
  EXPECT_FALSE(UmbrafoxUserlandMutation::ShouldDispatchMutation(target));
  UmbrafoxUserlandMutation::ChildListDecision decision;
  decision.mCancelled = true;
  EXPECT_TRUE(UmbrafoxUserlandMutation::MaybeDispatchChildListMutation(
      target, "insert"_ns, nullptr, nullptr, nullptr, nullptr, &decision));
  EXPECT_FALSE(decision.mCancelled);
  EXPECT_FALSE(decision.mReplacementNode);
  for (const bool active : {false, true, false, true, false}) {
    ASSERT_EQ(Preferences::SetBool(kActivePref, active), NS_OK);
    ASSERT_EQ(StaticPrefs::umbrafox_userlandScripts_active(), active);
    EXPECT_FALSE(UmbrafoxUserlandMutation::ShouldDispatchMutation(nullptr));
    EXPECT_FALSE(UmbrafoxUserlandMutation::ShouldDispatchMutation(target));
  }
}

TEST(UmbrafoxMutationGate, ActiveMirrorTracksChanges)
{
  ASSERT_FALSE(Preferences::HasUserValue(kActivePref));
  const auto restore =
      MakeScopeExit([] { Preferences::ClearUser(kActivePref); });
  ActivePrefObservation observation;
  ASSERT_EQ(
      Preferences::RegisterCallback(
          ObserveActivePref, nsDependentCString(kActivePref), &observation),
      NS_OK);
  const auto unregister = MakeScopeExit([&] {
    Preferences::UnregisterCallback(
        ObserveActivePref, nsDependentCString(kActivePref), &observation);
  });
  EXPECT_FALSE(StaticPrefs::umbrafox_userlandScripts_active());
  for (uint32_t iteration = 0; iteration < 16; ++iteration) {
    for (const bool active : {true, false, true}) {
      observation.mExpected = active;
      ASSERT_EQ(Preferences::SetBool(kActivePref, active), NS_OK);
      EXPECT_EQ(StaticPrefs::umbrafox_userlandScripts_active(), active);
      EXPECT_EQ(Preferences::GetBool(kActivePref, !active), active);
    }
    observation.mExpected = false;
    Preferences::ClearUser(kActivePref);
    EXPECT_FALSE(StaticPrefs::umbrafox_userlandScripts_active());
    EXPECT_FALSE(Preferences::GetBool(kActivePref, true));
  }
  EXPECT_EQ(observation.mCalls, 64u);
}

TEST(UmbrafoxMutationGate, DISABLED_InactiveCostSurvey)
{
  ASSERT_FALSE(Preferences::HasUserValue(kActivePref));
  const auto restore =
      MakeScopeExit([] { Preferences::ClearUser(kActivePref); });
  const RefPtr<nsTextNode> target = MakeMutationGateTarget();
  volatile std::atomic<bool> cached(false);
  bool textValue = false;
  for (const bool present : {false, true}) {
    if (present) {
      ASSERT_EQ(Preferences::SetBool(kActivePref, false), NS_OK);
    }
    ASSERT_FALSE(Preferences::GetBool(kActivePref, false));
    for (uint32_t round = 0; round < 8; ++round) {
      for (uint32_t position = 0; position < 4; ++position) {
        const uint32_t mode = (round + position) % 4;
        double nanoseconds;
        const char* label;
        if (mode == 0) {
          label = "native-gate";
          nanoseconds = MeasureInactiveGate([&] {
            return UmbrafoxUserlandMutation::ShouldDispatchMutation(target);
          });
        } else if (mode == 1) {
          label = "preference-read";
          nanoseconds = MeasureInactiveGate(
              [] { return Preferences::GetBool(kActivePref, false); });
        } else if (mode == 2) {
          label = "atomic-reference";
          nanoseconds = MeasureInactiveGate(
              [&] { return cached.load(std::memory_order_relaxed); });
        } else {
          label = "character-data";
          nanoseconds = MeasureInactiveGate([&] {
            textValue = !textValue;
            target->SetData(textValue ? u"a"_ns : u"b"_ns, IgnoreErrors());
            return false;
          });
          nsAutoString data;
          target->GetData(data);
          EXPECT_TRUE(data.EqualsLiteral("b"));
        }
        printf(
            "UMBRA_GATE_BENCH {\"present\":%s,\"round\":%u,"
            "\"position\":%u,\"mode\":\"%s\",\"iterations\":1000000,"
            "\"nsPerCall\":%.9f}\n",
            present ? "true" : "false", round, position, label, nanoseconds);
      }
    }
  }
}
