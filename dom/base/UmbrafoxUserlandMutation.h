/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef UmbrafoxUserlandMutation_h
#define UmbrafoxUserlandMutation_h

#include "nsCOMPtr.h"
#include "nsStringFwd.h"

class nsAtom;
class nsIContent;
class nsINode;

namespace mozilla::dom {

class CharacterData;
class Element;

class UmbrafoxUserlandMutation {
 public:
  struct ChildListDecision {
    bool mCancelled = false;
    nsCOMPtr<nsINode> mReplacementNode;
  };

  static bool ShouldDispatchMutation(nsINode* aTarget);

  static bool MaybeDispatchChildListMutation(
      nsINode* aTarget, const nsACString& aOperation, nsIContent* aAddedNode,
      nsIContent* aRemovedNode, nsIContent* aPreviousSibling,
      nsIContent* aNextSibling, ChildListDecision* aDecision);

  static bool MaybeDispatchAttributeMutation(Element* aTarget,
                                             int32_t aNamespaceID,
                                             nsAtom* aName,
                                             const nsAString* aOldValue,
                                             nsAString& aNewValue);

  static bool MaybeDispatchAttributeRemoval(Element* aTarget,
                                            int32_t aNamespaceID, nsAtom* aName,
                                            const nsAString& aOldValue);

  static bool MaybeDispatchCharacterDataMutation(CharacterData* aTarget,
                                                 const nsAString& aOldData,
                                                 nsAString& aNewData);
};

}  // namespace mozilla::dom

#endif  // UmbrafoxUserlandMutation_h
