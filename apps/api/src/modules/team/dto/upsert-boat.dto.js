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
exports.UpsertBoatDto = void 0;
var class_validator_1 = require("class-validator");
var UpsertBoatDto = function () {
    var _a;
    var _teamId_decorators;
    var _teamId_initializers = [];
    var _teamId_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _registry_decorators;
    var _registry_initializers = [];
    var _registry_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpsertBoatDto() {
                this.teamId = __runInitializers(this, _teamId_initializers, void 0);
                this.name = (__runInitializers(this, _teamId_extraInitializers), __runInitializers(this, _name_initializers, void 0));
                this.registry = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _registry_initializers, void 0));
                __runInitializers(this, _registry_extraInitializers);
            }
            return UpsertBoatDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _teamId_decorators = [(0, class_validator_1.IsString)()];
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2)];
            _registry_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _teamId_decorators, { kind: "field", name: "teamId", static: false, private: false, access: { has: function (obj) { return "teamId" in obj; }, get: function (obj) { return obj.teamId; }, set: function (obj, value) { obj.teamId = value; } }, metadata: _metadata }, _teamId_initializers, _teamId_extraInitializers);
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _registry_decorators, { kind: "field", name: "registry", static: false, private: false, access: { has: function (obj) { return "registry" in obj; }, get: function (obj) { return obj.registry; }, set: function (obj, value) { obj.registry = value; } }, metadata: _metadata }, _registry_initializers, _registry_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpsertBoatDto = UpsertBoatDto;
