/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use super::*;
use std::cell::RefCell;
use std::panic::{catch_unwind, AssertUnwindSafe};

struct Backend {
    supported: bool,
    events: Rc<RefCell<Vec<String>>>,
}

impl GpuQueryBackend for Backend {
    fn create_queries(&self, _: usize) -> Vec<GpuQueryId> { panic!("unexpected query") }
    fn delete_queries(&self, _: &[GpuQueryId]) { panic!("unexpected query") }
    fn begin_query(&self, _: GpuQueryKind, _: GpuQueryId) { panic!("unexpected query") }
    fn end_query(&self, _: GpuQueryKind) { panic!("unexpected query") }
    fn query_result(&self, _: GpuQueryId) -> u64 { panic!("unexpected query") }
    fn supports_markers(&self) -> bool { self.supported }
    fn push_marker_group(&self, label: &str) { self.events.borrow_mut().push(label.to_owned()); }
    fn pop_marker_group(&self) { self.events.borrow_mut().push("pop".to_owned()); }
    fn insert_marker(&self, label: &str) { self.events.borrow_mut().push(label.to_owned()); }
}

fn profiler(supported: bool) -> (GpuProfiler, Rc<RefCell<Vec<String>>>) {
    let events = Rc::new(RefCell::new(Vec::new()));
    let backend = Rc::new(Backend { supported, events: Rc::clone(&events) });
    (GpuProfiler::new(backend), events)
}

#[test]
fn exact_labels() {
    let (mut profiler, events) = profiler(true);
    for index in (0..2048).chain([usize::MAX / 10, usize::MAX]) {
        let marker = profiler.start_pass_marker(index);
        assert_eq!(*events.borrow(), [format!("pass {}", index)]);
        drop(marker);
        assert_eq!(*events.borrow(), [format!("pass {}", index), "pop".to_owned()]);
        events.borrow_mut().clear();
    }
}

#[test]
fn unsupported_markers_do_nothing() {
    let (mut profiler, events) = profiler(false);
    drop(profiler.start_pass_marker(usize::MAX));
    drop(profiler.start_marker("static"));
    profiler.place_marker("event");
    drop(profiler);
    assert!(events.borrow().is_empty());
}

#[test]
fn nested_static_and_pass_markers() {
    let (mut profiler, events) = profiler(true);
    let outer = profiler.start_marker("outer");
    let inner = profiler.start_pass_marker(7);
    profiler.place_marker("event");
    drop(inner);
    drop(outer);
    assert_eq!(*events.borrow(), ["outer", "pass 7", "event", "pop", "pop"]);
}

#[test]
fn pass_marker_balances_during_unwind() {
    let (mut profiler, events) = profiler(true);
    assert!(catch_unwind(AssertUnwindSafe(|| {
        let _marker = profiler.start_pass_marker(3);
        panic!("test unwind");
    })).is_err());
    assert_eq!(*events.borrow(), ["pass 3", "pop"]);
}

#[test]
fn marker_keeps_backend_alive_after_profiler() {
    let events = Rc::new(RefCell::new(Vec::new()));
    let backend = Rc::new(Backend { supported: true, events: Rc::clone(&events) });
    let weak = Rc::downgrade(&backend);
    let mut profiler = GpuProfiler::new(backend);
    let marker = profiler.start_pass_marker(0);
    drop(profiler);
    assert!(weak.upgrade().is_some());
    drop(marker);
    assert!(weak.upgrade().is_none());
    assert_eq!(*events.borrow(), ["pass 0", "pop"]);
}
