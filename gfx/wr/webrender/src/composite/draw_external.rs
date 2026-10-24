/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use super::*;

pub trait DrawExternalCompositor {
    /// Accept a fullscreen opaque surface, or hide the previous surface before
    /// returning false. None always hides it. EGL retains parent swap ownership.
    fn prepare(&mut self, surface: Option<&DrawExternalSurface>) -> bool;
}

#[repr(C)]
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct DrawExternalSurface {
    pub external_image_id: ExternalImageId,
    pub size: DeviceIntSize,
}

impl CompositeState {
    pub(crate) fn draw_external_surface(
        &self,
        size: DeviceIntSize,
    ) -> Option<(ResolvedExternalSurfaceIndex, DrawExternalSurface)> {
        if !matches!(self.compositor_kind, CompositorKind::Draw { .. })
            || size.width <= 0
            || size.height <= 0
            || size.width > i16::MAX as i32
            || size.height > i16::MAX as i32
        {
            return None;
        }
        let tile = self.tiles.first()?;
        let index = match tile.surface {
            CompositeTileSurface::ExternalSurface {
                external_surface_index,
            } => external_surface_index,
            _ => return None,
        };
        let transform = self.transforms.get(tile.transform_index.0)?;
        let rect = PictureRect::from_size(size.to_f32().cast_unit());
        if tile.kind != TileKind::Opaque
            || tile.clip_index.is_some()
            || tile.tile_id.is_some()
            || tile.local_rect != rect
            || tile.local_valid_rect != rect
            || tile.device_clip_rect != DeviceRect::from_size(size.to_f32())
            || transform.local_to_device != ScaleOffset::identity()
            || transform.local_to_raster != ScaleOffset::identity()
            || transform.raster_to_device != ScaleOffset::identity()
        {
            return None;
        }
        let surface = self.external_surfaces.get(index.0)?;
        if surface.update_params.is_some()
            || !matches!(
                surface.color_data,
                ResolvedExternalSurfaceColorData::Yuv {
                    channel_bit_depth: 8,
                    color_space: YuvRangedColorSpace::Rec709Narrow,
                    format: YuvFormat::NV12 | YuvFormat::PlanarYCbCr,
                    ..
                }
            )
        {
            return None;
        }
        Some((
            index,
            DrawExternalSurface {
                external_image_id: surface.external_image_id?,
                size,
            },
        ))
    }

    pub(crate) fn prepare_draw_external_surface(
        &self,
        size: DeviceIntSize,
        allowed: bool,
        compositor: &mut dyn DrawExternalCompositor,
    ) -> Option<ResolvedExternalSurfaceIndex> {
        let candidate = if allowed {
            self.draw_external_surface(size)
        } else {
            None
        };
        if compositor.prepare(candidate.as_ref().map(|(_, surface)| surface)) {
            candidate.map(|(index, _)| index)
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bump_allocator::ChunkPool;
    use crate::internal_types::FrameId;
    use std::sync::Arc;

    fn with_surface(test: impl FnOnce(&mut CompositeState, DeviceIntSize)) {
        let memory = FrameMemory::new(Arc::new(ChunkPool::new()), FrameId::first());
        let mut state = CompositeState::new(CompositorKind::default(), 16, true, false, &memory);
        let size = DeviceIntSize::new(1920, 1080);
        let transform_index =
            state.register_transform(ScaleOffset::identity(), ScaleOffset::identity());
        state.external_surfaces.push(ResolvedExternalSurface {
            color_data: ResolvedExternalSurfaceColorData::Yuv {
                image_dependencies: [ImageDependency::INVALID; 3],
                planes: [ExternalPlaneDescriptor::invalid(); 3],
                color_space: YuvRangedColorSpace::Rec709Narrow,
                format: YuvFormat::NV12,
                channel_bit_depth: 8,
            },
            image_buffer_kind: ImageBufferKind::Texture2D,
            update_params: None,
            external_image_id: Some(ExternalImageId(42)),
        });
        let rect = PictureRect::from_size(size.to_f32().cast_unit());
        state.tiles.push(CompositeTile {
            surface: CompositeTileSurface::ExternalSurface {
                external_surface_index: ResolvedExternalSurfaceIndex(0),
            },
            local_rect: rect,
            local_valid_rect: rect,
            local_dirty_rect: rect,
            device_clip_rect: DeviceRect::from_size(size.to_f32()),
            z_id: ZBufferId(0),
            kind: TileKind::Opaque,
            transform_index,
            clip_index: None,
            tile_id: None,
        });
        test(&mut state, size);
    }

    #[test]
    fn selects_resolved_image_without_descriptor_array() {
        with_surface(|state, size| {
            assert!(state.descriptor.surfaces.is_empty());
            assert_eq!(
                state.draw_external_surface(size),
                Some((
                    ResolvedExternalSurfaceIndex(0),
                    DrawExternalSurface {
                        external_image_id: ExternalImageId(42),
                        size
                    },
                ))
            );
        });
    }

    #[test]
    fn uses_the_exact_resolved_index() {
        with_surface(|state, size| {
            state.external_surfaces.push(ResolvedExternalSurface {
                color_data: state.external_surfaces[0].color_data.clone(),
                image_buffer_kind: ImageBufferKind::Texture2D,
                update_params: None,
                external_image_id: Some(ExternalImageId(99)),
            });
            state.tiles[0].surface = CompositeTileSurface::ExternalSurface {
                external_surface_index: ResolvedExternalSurfaceIndex(1),
            };
            assert_eq!(
                state
                    .draw_external_surface(size)
                    .unwrap()
                    .1
                    .external_image_id,
                ExternalImageId(99)
            );
        });
    }

    #[test]
    fn foreground_content_prevents_handoff() {
        with_surface(|state, size| {
            let mut foreground = state.tiles[0].clone();
            foreground.surface = CompositeTileSurface::Color {
                color: ColorF::WHITE,
            };
            state.tiles.insert(0, foreground);
            assert!(state.draw_external_surface(size).is_none());
        });
    }

    #[test]
    fn rejects_alpha_clips_and_transforms() {
        with_surface(|state, size| {
            state.tiles[0].kind = TileKind::Alpha;
            assert!(state.draw_external_surface(size).is_none());
            state.tiles[0].kind = TileKind::Opaque;
            let clip = state.register_clip(size.to_f32().into(), BorderRadius::zero());
            state.tiles[0].clip_index = Some(clip);
            assert!(state.draw_external_surface(size).is_none());
            state.tiles[0].clip_index = None;
            state.transforms[0].local_to_device.offset.x = 0.25;
            assert!(state.draw_external_surface(size).is_none());
            state.transforms[0].local_to_device.offset.x = 0.0;
            state.transforms[0].local_to_device.scale.x = -1.0;
            assert!(state.draw_external_surface(size).is_none());
        });
    }

    #[test]
    fn rejects_crop_nonfullscreen_and_nonfinite_geometry() {
        with_surface(|state, size| {
            state.tiles[0].local_valid_rect.max.x -= 1.0;
            assert!(state.draw_external_surface(size).is_none());
            state.tiles[0].local_valid_rect = state.tiles[0].local_rect;
            assert!(state
                .draw_external_surface(DeviceIntSize::new(1280, 720))
                .is_none());
            state.tiles[0].device_clip_rect.max.x = f32::INFINITY;
            assert!(state.draw_external_surface(size).is_none());
            state.tiles[0].device_clip_rect.max.x = f32::NAN;
            assert!(state.draw_external_surface(size).is_none());
        });
    }

    #[test]
    fn rejects_missing_host_invalid_index_and_hdr() {
        with_surface(|state, size| {
            state.external_surfaces[0].external_image_id = None;
            assert!(state.draw_external_surface(size).is_none());
            state.external_surfaces[0].external_image_id = Some(ExternalImageId(42));
            if let ResolvedExternalSurfaceColorData::Yuv {
                channel_bit_depth, ..
            } = &mut state.external_surfaces[0].color_data
            {
                *channel_bit_depth = 10;
            }
            assert!(state.draw_external_surface(size).is_none());
            state.tiles[0].surface = CompositeTileSurface::ExternalSurface {
                external_surface_index: ResolvedExternalSurfaceIndex(10),
            };
            assert!(state.draw_external_surface(size).is_none());
            state.tiles.clear();
            assert!(state.draw_external_surface(size).is_none());
        });
    }

    #[test]
    fn does_not_modify_the_other_compositor_modes() {
        with_surface(|state, size| {
            state.compositor_kind = CompositorKind::Layer {};
            assert!(state.draw_external_surface(size).is_none());
            state.compositor_kind = CompositorKind::Native {
                capabilities: CompositorCapabilities::default(),
            };
            assert!(state.draw_external_surface(size).is_none());
        });
    }

    #[test]
    fn default_configuration_does_not_enable_external_handoff() {
        let mut config = CompositorConfig::default();
        assert!(config.draw_external_compositor().is_none());
        assert!(config.compositor().is_none());
    }

    #[test]
    fn rejects_rgb_and_raster_transforms() {
        with_surface(|state, size| {
            state.transforms[0].local_to_raster.scale.x = 2.0;
            assert!(state.draw_external_surface(size).is_none());
            state.transforms[0].local_to_raster = ScaleOffset::identity();
            state.transforms[0].raster_to_device.offset.y = 1.0;
            assert!(state.draw_external_surface(size).is_none());
            state.transforms[0].raster_to_device = ScaleOffset::identity();
            state.external_surfaces[0].color_data = ResolvedExternalSurfaceColorData::Rgb {
                image_dependency: ImageDependency::INVALID,
                plane: ExternalPlaneDescriptor::invalid(),
                modulation: api::PremultipliedColorF::WHITE,
            };
            assert!(state.draw_external_surface(size).is_none());
        });
    }

    #[test]
    fn rejects_invalid_size_color_and_transform_indices() {
        with_surface(|state, size| {
            for bad in [
                DeviceIntSize::zero(),
                DeviceIntSize::new(-1, 1080),
                DeviceIntSize::new(32768, 1080),
            ] {
                assert!(state.draw_external_surface(bad).is_none());
            }
            if let ResolvedExternalSurfaceColorData::Yuv { color_space, .. } =
                &mut state.external_surfaces[0].color_data
            {
                *color_space = YuvRangedColorSpace::Rec709Full;
            }
            assert!(state.draw_external_surface(size).is_none());
            state.tiles[0].transform_index = CompositorTransformIndex::INVALID;
            assert!(state.draw_external_surface(size).is_none());
        });
    }

    #[test]
    fn rejected_handoff_and_disabled_path_do_not_omit_video() {
        struct Backend {
            accept: bool,
            requests: Vec<Option<DrawExternalSurface>>,
        }
        impl DrawExternalCompositor for Backend {
            fn prepare(&mut self, surface: Option<&DrawExternalSurface>) -> bool {
                self.requests.push(surface.copied());
                self.accept
            }
        }
        with_surface(|state, size| {
            let mut backend = Backend {
                accept: false,
                requests: Vec::new(),
            };
            assert!(state
                .prepare_draw_external_surface(size, true, &mut backend)
                .is_none());
            assert_eq!(
                backend.requests[0].unwrap().external_image_id,
                ExternalImageId(42)
            );
            backend.accept = true;
            assert_eq!(
                state.prepare_draw_external_surface(size, true, &mut backend),
                Some(ResolvedExternalSurfaceIndex(0))
            );
            assert!(state
                .prepare_draw_external_surface(size, false, &mut backend)
                .is_none());
            assert_eq!(backend.requests[2], None);
            state.tiles.clear();
            assert!(state
                .prepare_draw_external_surface(size, true, &mut backend)
                .is_none());
            assert_eq!(backend.requests[3], None);
        });
    }
}
