/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//! Bounded, allocation-free accounting for the external-surface handoff path.
//!
//! Each admission decision made by
//! [`CompositeState::prepare_draw_external_surface`](super::CompositeState::prepare_draw_external_surface)
//! is attributed to exactly one [`AdmissionReason`]. The counters are a fixed
//! array of atomics sized at compile time: they never allocate, never grow,
//! never take a lock and never hold a reference to a frame resource, so
//! recording on the per-frame draw path cannot itself become a source of
//! memory pressure in the measurement these counters exist to explain.
//!
//! This deliberately does *not* keep history, per-frame samples, timestamps or
//! labels. A bounded instrument that grows is not an instrument; for a time
//! series, sample these counters repeatedly from outside.

use std::sync::atomic::{AtomicU32, Ordering};

/// Why an external surface was, or was not, handed to the platform compositor.
///
/// Order and discriminants are part of the reporting format; append new
/// variants at the end and update [`AdmissionReason::ALL`] and
/// [`AdmissionReason::COUNT`] together. `admission::tests` asserts they agree.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum AdmissionReason {
    /// The candidate passed every gate and the backend accepted and attached it.
    Admitted = 0,
    /// The handoff pref was off, so no candidate was even scored.
    DisabledByPref,
    /// Compositing is not in `CompositorKind::Draw`; the handoff does not apply.
    NotDrawCompositor,
    /// Zero, negative or `i16`-overflowing target size.
    InvalidSize,
    /// No tiles at all to look at.
    NoTiles,
    /// The frontmost tile is not an external surface.
    FrontTileNotExternal,
    /// The tile referenced a transform that is not registered.
    MissingTransform,
    /// The frontmost tile is transparent, not opaque.
    NotOpaqueTile,
    /// The tile is clipped, so it does not cover the whole window.
    TileHasClip,
    /// The tile belongs to a tile cache, so partial coverage is possible.
    TileHasTileId,
    /// `local_rect` is not the full window.
    TileRectNotFullscreen,
    /// `local_valid_rect` is not the full window: cropped or partially valid.
    TileValidRectNotFullscreen,
    /// `device_clip_rect` is not the full window.
    TileClipRectNotFullscreen,
    /// A scale or offset is applied somewhere in the transform chain.
    NonIdentityTransform,
    /// The tile named an external surface that is not resolved this frame.
    MissingExternalSurface,
    /// The surface still has update parameters, i.e. the host is not ready.
    PendingUpdateParams,
    /// Not 8-bit Rec709Narrow NV12/planar YCbCr, or an RGB/raster path.
    UnsupportedColor,
    /// Resolved surface has no external image identity to hand over.
    MissingExternalImageId,
    /// The candidate was well formed but the platform backend declined it.
    BackendRejected,
    /// The backend was never asked, because the compositor interface is absent.
    BackendUnavailable,
}

impl AdmissionReason {
    /// Number of variants. Derived from [`Self::ALL`] so the two cannot drift.
    ///
    /// `cbindgen` cannot render `Self::ALL.len()` as a C++ constant
    /// expression, and nothing on the C++ side consumes this value, so it is
    /// kept out of the generated header entirely.
    /// cbindgen:ignore
    pub const COUNT: usize = Self::ALL.len();

    /// Every variant, in discriminant order.
    pub const ALL: [AdmissionReason; 20] = [
        AdmissionReason::Admitted,
        AdmissionReason::DisabledByPref,
        AdmissionReason::NotDrawCompositor,
        AdmissionReason::InvalidSize,
        AdmissionReason::NoTiles,
        AdmissionReason::FrontTileNotExternal,
        AdmissionReason::MissingTransform,
        AdmissionReason::NotOpaqueTile,
        AdmissionReason::TileHasClip,
        AdmissionReason::TileHasTileId,
        AdmissionReason::TileRectNotFullscreen,
        AdmissionReason::TileValidRectNotFullscreen,
        AdmissionReason::TileClipRectNotFullscreen,
        AdmissionReason::NonIdentityTransform,
        AdmissionReason::MissingExternalSurface,
        AdmissionReason::PendingUpdateParams,
        AdmissionReason::UnsupportedColor,
        AdmissionReason::MissingExternalImageId,
        AdmissionReason::BackendRejected,
        AdmissionReason::BackendUnavailable,
    ];

    /// Index into [`AdmissionCounters`].
    #[inline]
    pub fn index(self) -> usize {
        self as usize
    }

    /// Stable label for logs and test output. Never allocated.
    pub fn name(self) -> &'static str {
        match self {
            AdmissionReason::Admitted => "admitted",
            AdmissionReason::DisabledByPref => "disabled-by-pref",
            AdmissionReason::NotDrawCompositor => "not-draw-compositor",
            AdmissionReason::InvalidSize => "invalid-size",
            AdmissionReason::NoTiles => "no-tiles",
            AdmissionReason::FrontTileNotExternal => "front-tile-not-external",
            AdmissionReason::MissingTransform => "missing-transform",
            AdmissionReason::NotOpaqueTile => "not-opaque-tile",
            AdmissionReason::TileHasClip => "tile-has-clip",
            AdmissionReason::TileHasTileId => "tile-has-tile-id",
            AdmissionReason::TileRectNotFullscreen => "tile-rect-not-fullscreen",
            AdmissionReason::TileValidRectNotFullscreen => "tile-valid-rect-not-fullscreen",
            AdmissionReason::TileClipRectNotFullscreen => "tile-clip-rect-not-fullscreen",
            AdmissionReason::NonIdentityTransform => "non-identity-transform",
            AdmissionReason::MissingExternalSurface => "missing-external-surface",
            AdmissionReason::PendingUpdateParams => "pending-update-params",
            AdmissionReason::UnsupportedColor => "unsupported-color",
            AdmissionReason::MissingExternalImageId => "missing-external-image-id",
            AdmissionReason::BackendRejected => "backend-rejected",
            AdmissionReason::BackendUnavailable => "backend-unavailable",
        }
    }
}

const ZERO: AtomicU32 = AtomicU32::new(0);

/// Fixed-size counters, one per [`AdmissionReason`].
///
/// All operations are relaxed atomic adds: cheap enough for a per-frame path,
/// and safe to record from any thread that can reach a `CompositeState`.
pub struct AdmissionCounters {
    counts: [AtomicU32; AdmissionReason::COUNT],
}

impl AdmissionCounters {
    /// Const constructor so this can live in a `static`.
    pub const fn new() -> Self {
        AdmissionCounters {
            counts: [ZERO; AdmissionReason::COUNT],
        }
    }

    /// Attribute one decision. Saturating: a counter pins at `u32::MAX` rather
    /// than wrapping, so a long-running browser cannot report a falsely low
    /// count after a wrap.
    #[inline]
    pub fn record(&self, reason: AdmissionReason) {
        let slot = &self.counts[reason.index()];
        let mut current = slot.load(Ordering::Relaxed);
        loop {
            if current == u32::MAX {
                return;
            }
            match slot.compare_exchange_weak(
                current,
                current + 1,
                Ordering::Relaxed,
                Ordering::Relaxed,
            ) {
                Ok(_) => return,
                Err(observed) => current = observed,
            }
        }
    }

    /// Count recorded for one reason.
    #[inline]
    pub fn get(&self, reason: AdmissionReason) -> u32 {
        self.counts[reason.index()].load(Ordering::Relaxed)
    }

    /// Number of decisions recorded across all reasons.
    pub fn total(&self) -> u64 {
        AdmissionReason::ALL
            .iter()
            .map(|reason| u64::from(self.get(*reason)))
            .sum()
    }

    /// Number of admissions and rejections, as a pair.
    pub fn admitted_and_rejected(&self) -> (u64, u64) {
        let admitted = u64::from(self.get(AdmissionReason::Admitted));
        let total = self.total();
        (admitted, total.saturating_sub(admitted))
    }

    /// Zero every counter. Intended for tests and for "start of measurement".
    pub fn reset(&self) {
        for slot in self.counts.iter() {
            slot.store(0, Ordering::Relaxed);
        }
    }
}

impl Default for AdmissionCounters {
    fn default() -> Self {
        Self::new()
    }
}

/// Process-wide counters, written by the compositor draw path.
pub static ADMISSION_COUNTERS: AdmissionCounters = AdmissionCounters::new();

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn variant_indices_are_dense_and_unique() {
        let mut seen = [false; AdmissionReason::COUNT];
        for reason in AdmissionReason::ALL {
            let index = reason.index();
            assert!(index < AdmissionReason::COUNT, "{} out of range", reason.name());
            assert!(!seen[index], "duplicate index {index} at {}", reason.name());
            seen[index] = true;
        }
    }

    #[test]
    fn every_reason_has_a_distinct_name() {
        for (i, reason) in AdmissionReason::ALL.iter().enumerate() {
            for other in &AdmissionReason::ALL[i + 1..] {
                assert_ne!(reason.name(), other.name());
            }
        }
    }

    #[test]
    fn records_and_resets() {
        let counters = AdmissionCounters::new();
        assert_eq!(counters.total(), 0);
        counters.record(AdmissionReason::Admitted);
        counters.record(AdmissionReason::UnsupportedColor);
        counters.record(AdmissionReason::UnsupportedColor);
        assert_eq!(counters.get(AdmissionReason::Admitted), 1);
        assert_eq!(counters.get(AdmissionReason::UnsupportedColor), 2);
        assert_eq!(counters.total(), 3);
        counters.reset();
        assert_eq!(counters.total(), 0);
    }

    #[test]
    fn admitted_and_rejected_split_is_consistent() {
        let counters = AdmissionCounters::new();
        for _ in 0..4 {
            counters.record(AdmissionReason::Admitted);
        }
        counters.record(AdmissionReason::BackendRejected);
        let (admitted, rejected) = counters.admitted_and_rejected();
        assert!(rejected >= 1);
        assert!(admitted >= 4);
    }

    #[test]
    fn counter_is_a_fixed_size_array_not_a_growing_log() {
        // Size is entirely determined by the number of reasons: recording more
        // decisions, of any mix, cannot change it.
        let expected = AdmissionReason::COUNT * std::mem::size_of::<AtomicU32>();
        assert_eq!(std::mem::size_of::<AdmissionCounters>(), expected);
    }
}
