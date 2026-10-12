/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::convert::TryFrom;
use std::fmt::{self, Write};
use std::ops::Range;

pub(super) const MAX_SEARCH_FRAMES: usize = 128;
pub(super) const MAX_QUADS: usize = 128;
pub(super) const MAX_TASKS: usize = 64;
pub(super) const MAX_COMPOSITES: usize = 64;
pub(super) const MAX_BLOCKS: usize = 4096;
pub(super) const MAX_TRANSFORMS: usize = 64;
pub(super) const MAX_BYTES: usize = 256 * 1024;

pub(super) struct OptionalArray<T, const N: usize>(pub Option<[T; N]>);

impl<T: fmt::Debug, const N: usize> fmt::Display for OptionalArray<T, N> {
    fn fmt(&self, output: &mut fmt::Formatter<'_>) -> fmt::Result {
        let Some(values) = &self.0 else {
            return output.write_str("null");
        };
        output.write_str("[")?;
        for (index, value) in values.iter().enumerate() {
            if index != 0 {
                output.write_str(",")?;
            }
            write!(output, "{:?}", value)?;
        }
        output.write_str("]")
    }
}

#[derive(Debug, PartialEq)]
pub(super) enum SourceMatch {
    Absent,
    Unique,
    Ambiguous,
    Limit,
}

#[derive(Debug, PartialEq)]
pub(super) enum Selection {
    Idle,
    Begin,
    Incomplete(&'static str),
}

#[derive(Default)]
pub(super) struct Search {
    frames: usize,
    spent: bool,
}

impl Search {
    pub fn select(
        &mut self,
        enabled: bool,
        profiled: bool,
        inspect: impl FnOnce() -> SourceMatch,
    ) -> Selection {
        if !enabled || !profiled || self.spent {
            return Selection::Idle;
        }
        self.frames += 1;
        let result = match inspect() {
            SourceMatch::Absent if self.frames < MAX_SEARCH_FRAMES => Selection::Idle,
            SourceMatch::Absent => Selection::Incomplete("source-search-limit"),
            SourceMatch::Ambiguous => Selection::Incomplete("ambiguous-source"),
            SourceMatch::Limit => Selection::Incomplete("source-scan-limit"),
            SourceMatch::Unique => Selection::Begin,
        };
        self.spent = result != Selection::Idle;
        result
    }
}

#[derive(Debug, PartialEq)]
pub(super) struct QuadBlocks {
    pub header: usize,
    pub primitive: Range<usize>,
    pub segment: Option<Range<usize>>,
    pub task: usize,
}

pub(super) fn decode_quad(
    words: [i32; 4],
    integer_blocks: usize,
    float_blocks: usize,
    task_count: usize,
) -> Option<QuadBlocks> {
    let header = usize::try_from(words[0]).ok()?;
    let start = usize::try_from(words[1]).ok()?;
    let task = usize::try_from(words[3]).ok()?;
    let end = start.checked_add(5)?;
    if header >= integer_blocks || end > float_blocks || task >= task_count {
        return None;
    }
    let index = words[2] as u32 & 255;
    let segment = if index == 255 {
        None
    } else {
        let start = end.checked_add(index as usize * 2)?;
        let end = start.checked_add(2)?;
        if end > float_blocks {
            return None;
        }
        Some(start..end)
    };
    Some(QuadBlocks {
        header,
        primitive: start..end,
        segment,
        task,
    })
}

#[derive(Default)]
pub(super) struct Budget {
    pub quads: usize,
    pub tasks: usize,
    pub composites: usize,
    pub blocks: usize,
    pub transforms: usize,
    pub bytes: usize,
}

impl Budget {
    pub fn take(counter: &mut usize, amount: usize, limit: usize) -> bool {
        match counter.checked_add(amount) {
            Some(total) if total <= limit => {
                *counter = total;
                true
            }
            _ => false,
        }
    }
}

pub(super) struct QuadJoin {
    pub words: [i32; 4],
    pub binding: String,
    pub emissions: usize,
}

pub(super) struct CompositeJoin {
    pub bits: [u32; 38],
    pub binding: String,
    pub features: u32,
    pub emitted: bool,
}

pub(super) struct Trace {
    pub identity: String,
    pub budget: Budget,
    pub quads: Vec<QuadJoin>,
    pub failure: Option<&'static str>,
    pub draws: usize,
    pub pass: usize,
    pub target: usize,
    pub primary_emitted: bool,
    pub textures: Vec<String>,
    pub snapshot_scans: usize,
    pub composites: Vec<CompositeJoin>,
    pub reached_sources: Vec<String>,
    pub target_source: Option<String>,
    pub task_sources: Vec<String>,
    pub composition_passes: usize,
}

impl Trace {
    pub fn new(identity: String) -> Self {
        Self {
            identity,
            budget: Budget::default(),
            quads: Vec::new(),
            failure: None,
            draws: 0,
            pass: 0,
            target: 0,
            primary_emitted: false,
            textures: Vec::new(),
            snapshot_scans: 0,
            composites: Vec::new(),
            reached_sources: Vec::new(),
            target_source: None,
            task_sources: Vec::new(),
            composition_passes: 0,
        }
    }

    pub fn fail(&mut self, reason: &'static str) {
        if self.failure.is_none() {
            self.failure = Some(reason);
        }
    }

    pub fn inspect(&mut self) -> bool {
        if self.failure.is_some() {
            return false;
        }
        if !Budget::take(&mut self.snapshot_scans, 1, MAX_QUADS) {
            self.fail("snapshot-scan-limit");
            return false;
        }
        true
    }

    pub fn link_quad(&mut self, sources: &[String; 3], task: usize) {
        if self.failure.is_some() {
            return;
        }
        let Some(target) = &self.target_source else {
            self.fail("missing-draw-target");
            return;
        };
        if self.task_sources.get(task) != Some(target) {
            self.fail("task-target-mismatch");
            return;
        }
        if sources
            .iter()
            .any(|source| self.reached_sources.contains(source))
            && !self.reached_sources.contains(target)
        {
            if self.reached_sources.len() == MAX_TASKS {
                self.fail("source-chain-limit");
                return;
            }
            self.reached_sources.push(target.clone());
        }
    }

    pub fn record(&mut self, event: &str, args: fmt::Arguments<'_>) -> Option<String> {
        if self.failure.is_some() {
            return None;
        }
        let remaining = (MAX_BYTES - 1024).saturating_sub(self.budget.bytes);
        let mut text = BoundedText::new(remaining.min(16384));
        if write!(
            &mut text,
            "{{\"schema\":1,\"submission\":\"{}\",\"event\":\"{}\",{} }}",
            self.identity, event, args
        )
        .is_err()
        {
            self.fail("marker-byte-limit");
            return None;
        }
        let text = text.finish();
        self.budget.bytes += text.len();
        Some(text)
    }

    pub fn register_quad(&mut self, words: [i32; 4], binding: &str) -> Option<(usize, bool)> {
        if self.failure.is_some() {
            return None;
        }
        if let Some(index) = self
            .quads
            .iter()
            .position(|entry| entry.words == words && entry.binding == binding)
        {
            return Some((index, false));
        }
        if binding.len() > 512 || !Budget::take(&mut self.budget.quads, 1, MAX_QUADS) {
            self.fail("quad-limit");
            return None;
        }
        let index = self.quads.len();
        self.quads.push(QuadJoin {
            words,
            binding: binding.into(),
            emissions: 0,
        });
        Some((index, true))
    }

    pub fn emit_quad(&mut self, words: [i32; 4], binding: &str) -> Option<usize> {
        if self.failure.is_some() {
            return None;
        }
        let index = self
            .quads
            .iter()
            .position(|entry| entry.words == words && entry.binding == binding);
        match index {
            Some(index) if self.draws < MAX_QUADS => {
                self.quads[index].emissions += 1;
                self.draws += 1;
                Some(index)
            }
            _ => {
                self.fail("unmatched-or-excess-quad-draw");
                None
            }
        }
    }

    pub fn register_composite(
        &mut self,
        bits: [u32; 38],
        binding: &str,
        features: u32,
    ) -> Option<usize> {
        if self.failure.is_some() {
            return None;
        }
        if self.composites.len() == MAX_COMPOSITES || binding.len() > 512 {
            self.fail("composite-input-limit");
            return None;
        }
        let index = self.composites.len();
        self.composites.push(CompositeJoin {
            bits,
            binding: binding.into(),
            features,
            emitted: false,
        });
        Some(index)
    }

    pub fn emit_composite(
        &mut self,
        bits: [u32; 38],
        binding: &str,
        features: u32,
    ) -> Option<usize> {
        if self.failure.is_some() {
            return None;
        }
        let index = self.composites.iter().position(|entry| {
            !entry.emitted
                && entry.bits == bits
                && entry.binding == binding
                && entry.features == features
        });
        let Some(index) = index else {
            self.fail("unmatched-composite-draw");
            return None;
        };
        if !Budget::take(&mut self.budget.composites, 1, MAX_COMPOSITES) {
            self.fail("composite-draw-limit");
            return None;
        }
        self.composites[index].emitted = true;
        Some(index)
    }

    pub fn finish_reason(&self) -> Option<&'static str> {
        self.failure.or_else(|| {
            if self.quads.iter().any(|entry| entry.emissions == 0) {
                Some("unemitted-quad-input")
            } else if self.composites.iter().any(|entry| !entry.emitted) {
                Some("unemitted-composite-input")
            } else if self.budget.composites == 0 {
                Some("no-composite-emission")
            } else if !self.primary_emitted {
                Some("primary-source-not-emitted")
            } else {
                None
            }
        })
    }
}

pub(super) struct BoundedText {
    text: String,
    limit: usize,
}

impl BoundedText {
    pub fn new(limit: usize) -> Self {
        Self {
            text: String::new(),
            limit,
        }
    }

    pub fn finish(self) -> String {
        self.text
    }
}

impl Write for BoundedText {
    fn write_str(&mut self, value: &str) -> fmt::Result {
        if value.len() > self.limit.saturating_sub(self.text.len()) {
            return Err(fmt::Error);
        }
        self.text.push_str(value);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn disabled_never_inspects_or_spends() {
        let mut search = Search::default();
        assert_eq!(
            search.select(false, true, || panic!("disabled scan")),
            Selection::Idle
        );
        assert_eq!(
            search.select(true, false, || panic!("unprofiled scan")),
            Selection::Idle
        );
        assert_eq!(
            search.select(true, true, || SourceMatch::Unique),
            Selection::Begin
        );
    }

    #[test]
    fn absent_source_searches_until_exact_limit() {
        let mut search = Search::default();
        for _ in 1..MAX_SEARCH_FRAMES {
            assert_eq!(
                search.select(true, true, || SourceMatch::Absent),
                Selection::Idle
            );
        }
        assert_eq!(
            search.select(true, true, || SourceMatch::Absent),
            Selection::Incomplete("source-search-limit")
        );
        assert_eq!(
            search.select(true, true, || panic!("spent scan")),
            Selection::Idle
        );
    }

    #[test]
    fn ambiguity_limit_and_selection_spend_without_rearm() {
        for source in [
            SourceMatch::Ambiguous,
            SourceMatch::Limit,
            SourceMatch::Unique,
        ] {
            let mut search = Search::default();
            assert_ne!(search.select(true, true, || source), Selection::Idle);
            assert_eq!(search.select(false, true, || panic!()), Selection::Idle);
            assert_eq!(search.select(true, true, || panic!()), Selection::Idle);
        }
    }

    #[test]
    fn quad_layout_and_segment_sentinel() {
        assert_eq!(
            decode_quad([0, 2, 255, 1], 1, 7, 2),
            Some(QuadBlocks {
                header: 0,
                primitive: 2..7,
                segment: None,
                task: 1,
            })
        );
        assert_eq!(
            decode_quad([0, 0, 1, 0], 1, 9, 1),
            Some(QuadBlocks {
                header: 0,
                primitive: 0..5,
                segment: Some(7..9),
                task: 0,
            })
        );
        assert!(decode_quad([0, 0, 1, 0], 1, 8, 1).is_none());
    }

    #[test]
    fn malformed_addresses_do_not_panic() {
        for words in [
            [-1, 0, 255, 0],
            [0, -1, 255, 0],
            [0, 0, 255, -1],
            [1, 0, 255, 0],
            [0, i32::MAX, 254, 0],
            [0, 0, 255, 1],
        ] {
            assert!(decode_quad(words, 1, 8, 1).is_none());
        }
        assert!(decode_quad([0, 0, 255, 0], 1, 4, 1).is_none());
    }

    #[test]
    fn marker_budget_is_checked_before_append() {
        let mut output = BoundedText::new(4);
        assert!(write!(&mut output, "1234").is_ok());
        assert!(write!(&mut output, "5").is_err());
        assert_eq!(output.finish(), "1234");
    }

    #[test]
    fn snapshot_traversal_stops_at_limit_and_after_failure() {
        let mut trace = Trace::new("test".into());
        for _ in 0..MAX_QUADS {
            assert!(trace.inspect());
        }
        assert!(!trace.inspect());
        assert_eq!(trace.finish_reason(), Some("snapshot-scan-limit"));
        assert!(!trace.inspect());
        assert_eq!(trace.snapshot_scans, MAX_QUADS);
        let mut trace = Trace::new("test".into());
        trace.fail("invalid-input");
        assert!(!trace.inspect());
        assert_eq!(trace.snapshot_scans, 0);
    }

    #[test]
    fn source_chain_requires_actual_target_and_connected_inputs() {
        let mut trace = Trace::new("test".into());
        trace.reached_sources.push("image".into());
        trace.task_sources = vec!["intermediate".into(), "picture".into()];
        trace.target_source = Some("intermediate".into());
        trace.link_quad(&["unrelated".into(), "Invalid".into(), "Invalid".into()], 0);
        assert_eq!(trace.reached_sources, ["image"]);
        trace.link_quad(&["image".into(), "Invalid".into(), "Invalid".into()], 0);
        trace.target_source = Some("picture".into());
        trace.link_quad(
            &["intermediate".into(), "Invalid".into(), "Invalid".into()],
            1,
        );
        assert_eq!(trace.reached_sources, ["image", "intermediate", "picture"]);
        trace.target_source = None;
        trace.link_quad(&["image".into(), "Invalid".into(), "Invalid".into()], 0);
        assert_eq!(trace.finish_reason(), Some("missing-draw-target"));
    }

    #[test]
    fn task_target_mismatch_cannot_complete() {
        let mut trace = Trace::new("test".into());
        trace.target_source = Some("target".into());
        trace.task_sources.push("other".into());
        trace.link_quad(&["source".into(), "Invalid".into(), "Invalid".into()], 0);
        assert_eq!(trace.finish_reason(), Some("task-target-mismatch"));
    }

    #[test]
    fn composite_join_requires_final_attributes_binding_and_variant() {
        for (bits, binding, features) in [([1; 38], "a", 0), ([0; 38], "b", 0), ([0; 38], "a", 1)] {
            let mut trace = Trace::new("test".into());
            assert_eq!(trace.register_composite([0; 38], "a", 0), Some(0));
            assert_eq!(trace.finish_reason(), Some("unemitted-composite-input"));
            assert_eq!(trace.emit_composite(bits, binding, features), None);
        }
        let mut trace = Trace::new("test".into());
        trace.register_composite([0; 38], "a", 0);
        assert_eq!(trace.emit_composite([0; 38], "a", 0), Some(0));
        trace.primary_emitted = true;
        assert_eq!(trace.finish_reason(), None);
        assert_eq!(trace.emit_composite([0; 38], "a", 0), None);
    }

    #[test]
    fn count_budget_includes_exact_limit_and_rejects_overflow() {
        for limit in [
            MAX_QUADS,
            MAX_TASKS,
            MAX_COMPOSITES,
            MAX_BLOCKS,
            MAX_TRANSFORMS,
            MAX_BYTES,
        ] {
            let mut count = 0;
            assert!(Budget::take(&mut count, limit, limit));
            assert!(!Budget::take(&mut count, 1, limit));
            assert_eq!(count, limit);
            assert!(!Budget::take(&mut count, usize::MAX, limit));
        }
    }

    #[test]
    fn joins_require_same_words_and_binding_and_actual_emission() {
        let mut trace = Trace::new("test".into());
        let words = [0, 0, 255, 0];
        assert_eq!(trace.register_quad(words, "texture1"), Some((0, true)));
        assert_eq!(trace.register_quad(words, "texture1"), Some((0, false)));
        assert_eq!(trace.finish_reason(), Some("unemitted-quad-input"));
        assert_eq!(trace.emit_quad(words, "texture2"), None);
        assert_eq!(trace.finish_reason(), Some("unmatched-or-excess-quad-draw"));
        assert!(trace.record("ignored", format_args!("\"n\":0")).is_none());
    }

    #[test]
    fn successful_join_still_requires_composition() {
        let mut trace = Trace::new("test".into());
        trace.register_quad([0, 0, 255, 0], "texture1");
        assert_eq!(trace.emit_quad([0, 0, 255, 0], "texture1"), Some(0));
        assert_eq!(trace.finish_reason(), Some("no-composite-emission"));
        trace.budget.composites = 1;
        trace.primary_emitted = true;
        assert_eq!(trace.finish_reason(), None);
    }

    #[test]
    fn marker_limit_preserves_space_for_one_incomplete_record() {
        let mut trace = Trace::new("test".into());
        trace.budget.bytes = MAX_BYTES - 1024;
        assert!(trace.record("quad", format_args!("\"id\":0")).is_none());
        assert_eq!(trace.failure, Some("marker-byte-limit"));
        assert_eq!(trace.budget.bytes, MAX_BYTES - 1024);
    }
}
