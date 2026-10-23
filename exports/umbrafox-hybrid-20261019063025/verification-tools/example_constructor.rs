fn main() {
    let _configuration = webrender::CompositorConfig::Draw {
        max_partial_present_rects: 0,
        draw_previous_partial_present_regions: false,
        partial_present: None,
        external_compositor: None,
    };
}
