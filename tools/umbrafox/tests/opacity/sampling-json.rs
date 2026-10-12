/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#[path = "../../../../gfx/wr/webrender/src/renderer/sampling.rs"]
mod sampling;

fn main() {
  let mut trace = sampling::Trace::new("fixture:1:2".into());
  for clear in [Some([0, 0x80000000, 0x3f800000, u32::MAX]), None] {
    println!(
      "{}",
      trace
        .record(
          "target",
          format_args!("\"clear_bits\":{}", sampling::OptionalArray(clear))
        )
        .unwrap()
    );
  }
}
