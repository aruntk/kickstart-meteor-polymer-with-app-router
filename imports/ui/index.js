//import 'meteor/mwc:mixin';
//import './build.html';
//import './layouts/test-layout.html';
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var mwcDataUpdate = function mwcDataUpdate(element) {
  var data = element.getMeteorData();
  //  if(element.getMeteorData()){
  //  console.log('Use tracker instead of getMeteorData');
  //  }
  if (!data) {
    return;
  }

  if (element.__mwcFirstRun) {
    element.__mwcFirstRun = false;
    element._mwcSetData(data);
    return;
  }

  Tracker.afterFlush(function () {
    element._mwcSetData(data);
  });
};

window.mwcMixin = {
  properties: {
    subsReady: { type: Boolean, notify: true, value: true },
    mwcData: Object,
    __mwcHandles: { type: Array, value: [] },
    __mwcPush: { type: Array, value: [] },
    __mwcComputations: { type: Array, value: [] },
    __mwcComputationsIds: { type: Array, value: [] },
    __mwcBin: { type: Array, value: [] }
  },
  trackers: [],
  _mwcSetData: function _mwcSetData(data) {
    this.set('mwcData', data);
  },
  beforeRegister: function beforeRegister() {
    var _this = this;

    var mwcDeps = {};
    var observers = this.observers || [];
    var trackers = this.trackers;

    var _loop = function _loop(i) {
      var tracker = trackers[i];
      var sections = tracker.split(/[()]+/);
      var input = sections[1];
      var cb = sections[0];
      var rId = '__mwc_' + Random.id(10);
      var obj = {
        _id: rId,
        cb: cb
      };
      mwcDeps[tracker] = obj;
      var _trObFn = function _trObFn() {
        var dep = obj;
        dep.dep = this.__mwcDeps[tracker].dep || new Tracker.Dependency();

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        dep.args = args;
        this.__mwcDeps[tracker] = dep;
        this.__mwcDeps[tracker] = _.clone(this.__mwcDeps[tracker]);
        dep.dep.changed();
      };
      _this[rId] = _trObFn;
      observers.push(rId + '(' + input + ')');
    };

    for (var i = 0; i < trackers.length; i += 1) {
      _loop(i);
    }
    this.observers = observers;
    this.__mwcDeps = mwcDeps;
  },
  attached: function attached() {
    var _this2 = this;

    this.__mwcFirstRun = true;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      var _loop2 = function _loop2() {
        var i = _step.value;

        var obFn = function obFn() {
          _this2.__mwcDeps[i].dep = _this2.__mwcDeps[i].dep || new Tracker.Dependency();
          var args = _this2.__mwcDeps[i].args || [];
          _this2.__mwcDeps[i].dep.depend();
          _this2[_this2.__mwcDeps[i].cb].apply(_this2, _toConsumableArray(args));
          _this2.__mwcDeps = _.clone(_this2.__mwcDeps);
        };
        _this2.autorun(obFn.bind(_this2));
      };

      for (var _iterator = Object.keys(this.__mwcDeps)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        _loop2();
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    this.autorun(this.tracker);
    this.autorun(mwcDataUpdate.bind(null, this));
  },
  detached: function detached() {
    _.each(this.__mwcComputations, function (c) {
      c.stop();
    });
    this.__mwcComputations = [];
    this.__mwcHandles.forEach(function (h) {
      h.stop();
    });
    this.__mwcBin.forEach(function (h) {
      h.stop();
    });
  },
  _mwcPush: function _mwcPush(p, val) {
    var prop = _.clone(this[p]);
    prop.push(val);
    this.set(p, prop);
  },
  guard: function guard(f) {
    if (Meteor.isServer || !Tracker.currentComputation) {
      return f();
    }

    var dep = new Tracker.Dependency();
    dep.depend();

    var value = void 0;
    var newValue = void 0;
    Tracker.autorun(function (comp) {
      newValue = f();
      if (!comp.firstRun && !EJSON.equals(newValue, value)) {
        dep.changed();
      }
      value = EJSON.clone(newValue);
    });
    return newValue;
  },
  autorun: function autorun(f) {
    var _this3 = this;

    var cb = function cb(c) {
      if (!_.find(_this3.__mwcComputationsIds, function (_id) {
        return _id === c._id;
      })) {
        _this3._mwcPush('__mwcComputationsIds', c._id);
        _this3._mwcPush('__mwcComputations', c);
      }
      f.bind(_this3)(c);
    };
    return Tracker.autorun(cb.bind(this));
  },
  _removeSubs: function _removeSubs(val) {
    var handles = _.reject(_.clone(this.__mwcHandles), function (h) {
      if (h.subscriptionId === val.subscriptionId) {
        return true;
      }
      return false;
    });
    this._mwcPush('__mwcBin', val);
    this.set('__mwcHandles', handles);
  },
  subscribe: function subscribe() {
    var _this4 = this;

    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var handle = Meteor.subscribe.apply(null, args);
    this._mwcPush('__mwcHandles', handle);
    this._subsReady();
    var afterSub = function afterSub(c) {
      if (handle.ready()) {
        _this4._removeSubs(handle);
        _this4._subsReady();
        c.stop();
      }
    };
    this.autorun(afterSub.bind(this));
    return handle;
  },
  _subsReady: function _subsReady() {
    var isReady = _.every(this.__mwcHandles, function (sub) {
      return sub && sub.ready();
    });
    this.set('subsReady', isReady);
    return isReady;
  },
  getMeteorData: function getMeteorData() {},
  tracker: function tracker() {}
};


