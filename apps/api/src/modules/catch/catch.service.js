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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatchService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var CatchService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var CatchService = _classThis = /** @class */ (function () {
        function CatchService_1(prisma, audit, leaderboard) {
            this.prisma = prisma;
            this.audit = audit;
            this.leaderboard = leaderboard;
        }
        CatchService_1.prototype.assertUserCanAccessCatch = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var c;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.catch.findUnique({ where: { id: params.catchId } })];
                        case 1:
                            c = _a.sent();
                            if (!c)
                                throw new common_1.NotFoundException("Catch not found");
                            if (c.createdById === params.userId)
                                return [2 /*return*/, c];
                            if (!params.allowCommittee)
                                throw new common_1.ForbiddenException("Not allowed");
                            return [2 /*return*/, c];
                    }
                });
            });
        };
        CatchService_1.prototype.computeScore = function (rule, c) {
            var _a, _b;
            var weight = (_a = c.weightKg) !== null && _a !== void 0 ? _a : 0;
            var length = (_b = c.lengthCm) !== null && _b !== void 0 ? _b : 0;
            return rule.basePoints + rule.weightKgMultiplier * weight + rule.lengthCmPointsPerCm * length;
        };
        CatchService_1.prototype.submitCatch = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var membership, team, scoringRule, created;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.teamMember.findFirst({ where: { userId: params.actorId } })];
                        case 1:
                            membership = _a.sent();
                            if (!membership)
                                throw new common_1.ForbiddenException("User is not part of a team");
                            return [4 /*yield*/, this.prisma.team.findUnique({ where: { id: membership.teamId } })];
                        case 2:
                            team = _a.sent();
                            if (!team)
                                throw new common_1.ForbiddenException("Team not found");
                            if (team.tournamentId !== params.tournamentId)
                                throw new common_1.BadRequestException("Team is not in tournament");
                            return [4 /*yield*/, this.prisma.scoringRule.findFirst({
                                    where: { tournamentId: params.tournamentId, categoryId: params.categoryId, isActive: true }
                                })];
                        case 3:
                            scoringRule = _a.sent();
                            if (!scoringRule)
                                throw new common_1.BadRequestException("No scoring rule for category");
                            return [4 /*yield*/, this.prisma.catch.create({
                                    data: {
                                        tournamentId: params.tournamentId,
                                        teamId: team.id,
                                        createdById: params.actorId,
                                        categoryId: params.categoryId,
                                        speciesId: params.speciesId,
                                        type: params.type,
                                        status: "pending_review",
                                        occurredAtClient: params.occurredAtClient,
                                        weightKg: params.weightKg,
                                        lengthCm: params.lengthCm,
                                        notes: params.notes,
                                        scorePreliminary: 0,
                                        scoreOfficial: 0
                                    },
                                    include: { category: true, species: true, team: true }
                                })];
                        case 4:
                            created = _a.sent();
                            return [4 /*yield*/, this.audit.log({
                                    ctx: { actorId: params.actorId },
                                    action: "catch.submit",
                                    entity: "Catch",
                                    entityId: created.id,
                                    meta: { tournamentId: created.tournamentId, teamId: created.teamId, categoryId: created.categoryId, type: created.type }
                                })];
                        case 5:
                            _a.sent();
                            if (!scoringRule.requiresMedia) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.leaderboard.broadcastCatchEvent(created.tournamentId, { type: "catch_submitted", catchId: created.id })];
                        case 6:
                            _a.sent();
                            _a.label = 7;
                        case 7: return [2 /*return*/, created];
                    }
                });
            });
        };
        CatchService_1.prototype.addMedia = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var c, created;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.assertUserCanAccessCatch({ userId: params.actorId, catchId: params.catchId, allowCommittee: false })];
                        case 1:
                            c = _a.sent();
                            if (["approved", "official"].includes(c.status)) {
                                throw new common_1.BadRequestException("Cannot modify media after approval/official without workflow");
                            }
                            return [4 /*yield*/, this.prisma.catchMedia.create({
                                    data: { catchId: params.catchId, type: params.type, objectKey: params.objectKey, url: params.url }
                                })];
                        case 2:
                            created = _a.sent();
                            return [4 /*yield*/, this.audit.log({
                                    ctx: { actorId: params.actorId },
                                    action: "catch.media.add",
                                    entity: "CatchMedia",
                                    entityId: created.id,
                                    meta: { catchId: params.catchId, type: params.type, objectKey: params.objectKey }
                                })];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, created];
                    }
                });
            });
        };
        CatchService_1.prototype.myCatchHistory = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var membership;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.teamMember.findFirst({ where: { userId: userId } })];
                        case 1:
                            membership = _a.sent();
                            if (!membership)
                                throw new common_1.NotFoundException("No team membership");
                            return [2 /*return*/, this.prisma.catch.findMany({
                                    where: { teamId: membership.teamId },
                                    include: { media: true, category: true, species: true },
                                    orderBy: { createdAt: "desc" },
                                    take: 50
                                })];
                    }
                });
            });
        };
        CatchService_1.prototype.listPendingForCommittee = function (tournamentId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.catch.findMany({
                            where: { tournamentId: tournamentId, status: { in: ["pending_review", "more_evidence_required"] } },
                            include: { team: true, category: true, species: true, media: true },
                            orderBy: { createdAt: "asc" },
                            take: 100
                        })];
                });
            });
        };
        CatchService_1.prototype.reviewCatch = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var c, scoringRule, reviewActionMap, score, nextStatus, updated;
                var _this = this;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.catch.findUnique({
                                where: { id: params.catchId },
                                include: { tournament: true, media: true }
                            })];
                        case 1:
                            c = _b.sent();
                            if (!c)
                                throw new common_1.NotFoundException("Catch not found");
                            return [4 /*yield*/, this.prisma.scoringRule.findFirst({
                                    where: { tournamentId: c.tournamentId, categoryId: c.categoryId, isActive: true }
                                })];
                        case 2:
                            scoringRule = _b.sent();
                            if (!scoringRule)
                                throw new common_1.BadRequestException("No scoring rule for category");
                            if (params.action === "approve" && scoringRule.requiresMedia && c.media.length === 0) {
                                throw new common_1.BadRequestException("Media evidence required for this catch type/category");
                            }
                            if (params.action === "penalize" && (params.penaltyPoints == null || params.penaltyPoints <= 0)) {
                                throw new common_1.BadRequestException("penaltyPoints required for penalize");
                            }
                            reviewActionMap = {
                                approve: client_1.ReviewAction.approve,
                                reject: client_1.ReviewAction.reject,
                                request_more_evidence: client_1.ReviewAction.request_more_evidence,
                                penalize: client_1.ReviewAction.penalize
                            };
                            score = this.computeScore(scoringRule, c);
                            nextStatus = params.action === "approve"
                                ? "approved"
                                : params.action === "reject"
                                    ? "rejected"
                                    : params.action === "request_more_evidence"
                                        ? "more_evidence_required"
                                        : "penalized";
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var review, updatedCatch;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.catchReview.create({
                                                    data: {
                                                        catchId: c.id,
                                                        reviewerId: params.reviewerId,
                                                        action: reviewActionMap[params.action],
                                                        notes: params.notes,
                                                        penaltyPoints: params.penaltyPoints
                                                    }
                                                })];
                                            case 1:
                                                review = _a.sent();
                                                return [4 /*yield*/, tx.catch.update({
                                                        where: { id: c.id },
                                                        data: {
                                                            status: nextStatus,
                                                            scorePreliminary: params.action === "approve" ? score : c.scorePreliminary,
                                                            // Official is only set by admin export/lock flow in this MVP
                                                            scoreOfficial: c.scoreOfficial
                                                        }
                                                    })];
                                            case 2:
                                                updatedCatch = _a.sent();
                                                return [2 /*return*/, { review: review, updatedCatch: updatedCatch }];
                                        }
                                    });
                                }); })];
                        case 3:
                            updated = _b.sent();
                            return [4 /*yield*/, this.audit.log({
                                    ctx: { actorId: params.reviewerId },
                                    action: "catch.review",
                                    entity: "Catch",
                                    entityId: c.id,
                                    meta: {
                                        action: params.action,
                                        nextStatus: nextStatus,
                                        scorePreliminary: updated.updatedCatch.scorePreliminary,
                                        penaltyPoints: (_a = params.penaltyPoints) !== null && _a !== void 0 ? _a : null
                                    }
                                })];
                        case 4:
                            _b.sent();
                            return [4 /*yield*/, this.leaderboard.broadcastLeaderboardRefresh(c.tournamentId)];
                        case 5:
                            _b.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        CatchService_1.prototype.markOfficial = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var c, updated;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.catch.findUnique({ where: { id: params.catchId } })];
                        case 1:
                            c = _a.sent();
                            if (!c)
                                throw new common_1.NotFoundException("Catch not found");
                            if (c.status !== "approved")
                                throw new common_1.BadRequestException("Only approved catches can be marked official");
                            return [4 /*yield*/, this.prisma.catch.update({
                                    where: { id: c.id },
                                    data: { status: "official", scoreOfficial: c.scorePreliminary }
                                })];
                        case 2:
                            updated = _a.sent();
                            return [4 /*yield*/, this.audit.log({
                                    ctx: { actorId: params.actorId },
                                    action: "catch.markOfficial",
                                    entity: "Catch",
                                    entityId: updated.id,
                                    meta: { scoreOfficial: updated.scoreOfficial }
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.leaderboard.broadcastLeaderboardRefresh(updated.tournamentId)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, updated];
                    }
                });
            });
        };
        return CatchService_1;
    }());
    __setFunctionName(_classThis, "CatchService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CatchService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CatchService = _classThis;
}();
exports.CatchService = CatchService;
