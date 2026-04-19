"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCatchMediaDto = void 0;
var class_validator_1 = require("class-validator");
var AddCatchMediaDto = function () {
    var _a;
    var _catchId_decorators;
    var _catchId_initializers = [];
    var _catchId_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _objectKey_decorators;
    var _objectKey_initializers = [];
    var _objectKey_extraInitializers = [];
    var _url_decorators;
    var _url_initializers = [];
    var _url_extraInitializers = [];
    return _a = /** @class */ (function () {
            function AddCatchMediaDto() {
                this.catchId = __runInitializers(this, _catchId_initializers, void 0);
                this.type = (__runInitializers(this, _catchId_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.objectKey = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _objectKey_initializers, void 0));
                this.url = (__runInitializers(this, _objectKey_extraInitializers), __runInitializers(this, _url_initializers, void 0));
                __runInitializers(this, _url_extraInitializers);
            }
            return AddCatchMediaDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _catchId_decorators = [(0, class_validator_1.IsString)()];
            _type_decorators = [(0, class_validator_1.IsIn)(["photo", "video"])];
            _objectKey_decorators = [(0, class_validator_1.IsString)()];
            _url_decorators = [(0, class_validator_1.IsUrl)()];
            __esDecorate(null, null, _catchId_decorators, { kind: "field", name: "catchId", static: false, private: false, access: { has: function (obj) { return "catchId" in obj; }, get: function (obj) { return obj.catchId; }, set: function (obj, value) { obj.catchId = value; } }, metadata: _metadata }, _catchId_initializers, _catchId_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _objectKey_decorators, { kind: "field", name: "objectKey", static: false, private: false, access: { has: function (obj) { return "objectKey" in obj; }, get: function (obj) { return obj.objectKey; }, set: function (obj, value) { obj.objectKey = value; } }, metadata: _metadata }, _objectKey_initializers, _objectKey_extraInitializers);
            __esDecorate(null, null, _url_decorators, { kind: "field", name: "url", static: false, private: false, access: { has: function (obj) { return "url" in obj; }, get: function (obj) { return obj.url; }, set: function (obj, value) { obj.url = value; } }, metadata: _metadata }, _url_initializers, _url_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.AddCatchMediaDto = AddCatchMediaDto;
