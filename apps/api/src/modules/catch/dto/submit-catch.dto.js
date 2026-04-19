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
exports.SubmitCatchDto = void 0;
var class_validator_1 = require("class-validator");
var SubmitCatchDto = function () {
    var _a;
    var _tournamentId_decorators;
    var _tournamentId_initializers = [];
    var _tournamentId_extraInitializers = [];
    var _categoryId_decorators;
    var _categoryId_initializers = [];
    var _categoryId_extraInitializers = [];
    var _speciesId_decorators;
    var _speciesId_initializers = [];
    var _speciesId_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _occurredAtClient_decorators;
    var _occurredAtClient_initializers = [];
    var _occurredAtClient_extraInitializers = [];
    var _weightKg_decorators;
    var _weightKg_initializers = [];
    var _weightKg_extraInitializers = [];
    var _lengthCm_decorators;
    var _lengthCm_initializers = [];
    var _lengthCm_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SubmitCatchDto() {
                this.tournamentId = __runInitializers(this, _tournamentId_initializers, void 0);
                this.categoryId = (__runInitializers(this, _tournamentId_extraInitializers), __runInitializers(this, _categoryId_initializers, void 0));
                this.speciesId = (__runInitializers(this, _categoryId_extraInitializers), __runInitializers(this, _speciesId_initializers, void 0));
                this.type = (__runInitializers(this, _speciesId_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                this.occurredAtClient = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _occurredAtClient_initializers, void 0));
                this.weightKg = (__runInitializers(this, _occurredAtClient_extraInitializers), __runInitializers(this, _weightKg_initializers, void 0));
                this.lengthCm = (__runInitializers(this, _weightKg_extraInitializers), __runInitializers(this, _lengthCm_initializers, void 0));
                this.notes = (__runInitializers(this, _lengthCm_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                __runInitializers(this, _notes_extraInitializers);
            }
            return SubmitCatchDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _tournamentId_decorators = [(0, class_validator_1.IsString)()];
            _categoryId_decorators = [(0, class_validator_1.IsString)()];
            _speciesId_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _type_decorators = [(0, class_validator_1.IsIn)(["release", "weigh_in"])];
            _occurredAtClient_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsISO8601)()];
            _weightKg_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(500)];
            _lengthCm_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(1000)];
            _notes_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _tournamentId_decorators, { kind: "field", name: "tournamentId", static: false, private: false, access: { has: function (obj) { return "tournamentId" in obj; }, get: function (obj) { return obj.tournamentId; }, set: function (obj, value) { obj.tournamentId = value; } }, metadata: _metadata }, _tournamentId_initializers, _tournamentId_extraInitializers);
            __esDecorate(null, null, _categoryId_decorators, { kind: "field", name: "categoryId", static: false, private: false, access: { has: function (obj) { return "categoryId" in obj; }, get: function (obj) { return obj.categoryId; }, set: function (obj, value) { obj.categoryId = value; } }, metadata: _metadata }, _categoryId_initializers, _categoryId_extraInitializers);
            __esDecorate(null, null, _speciesId_decorators, { kind: "field", name: "speciesId", static: false, private: false, access: { has: function (obj) { return "speciesId" in obj; }, get: function (obj) { return obj.speciesId; }, set: function (obj, value) { obj.speciesId = value; } }, metadata: _metadata }, _speciesId_initializers, _speciesId_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _occurredAtClient_decorators, { kind: "field", name: "occurredAtClient", static: false, private: false, access: { has: function (obj) { return "occurredAtClient" in obj; }, get: function (obj) { return obj.occurredAtClient; }, set: function (obj, value) { obj.occurredAtClient = value; } }, metadata: _metadata }, _occurredAtClient_initializers, _occurredAtClient_extraInitializers);
            __esDecorate(null, null, _weightKg_decorators, { kind: "field", name: "weightKg", static: false, private: false, access: { has: function (obj) { return "weightKg" in obj; }, get: function (obj) { return obj.weightKg; }, set: function (obj, value) { obj.weightKg = value; } }, metadata: _metadata }, _weightKg_initializers, _weightKg_extraInitializers);
            __esDecorate(null, null, _lengthCm_decorators, { kind: "field", name: "lengthCm", static: false, private: false, access: { has: function (obj) { return "lengthCm" in obj; }, get: function (obj) { return obj.lengthCm; }, set: function (obj, value) { obj.lengthCm = value; } }, metadata: _metadata }, _lengthCm_initializers, _lengthCm_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.SubmitCatchDto = SubmitCatchDto;
