"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
function logType(target, key) {
    var t = Reflect.getMetadata("design:type", target, key);
    console.log(target);
    console.log(key + " type: " + t.name);
}
function logParamTypes(target, key) {
    var types = Reflect.getMetadata("design:paramtypes", target, key);
    var s = types.map(function (a) { return a.name; }).join();
    console.log(key + " param types: " + s);
}
function logReturnType(target, key) {
    var t = Reflect.getMetadata("design:returntype", target, key);
    console.log(key + " type: " + t.name);
}
function logDec(config) {
    return function (target, name, value) {
        var oldValue = value.value;
        if (value && value.value) {
            value.value = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                console.log("\u8DEF\u7531\uFF1A" + config.path + "\uFF0C\u8DEF\u7531\u65B9\u6CD5\uFF1A" + config.method + ",\u53C2\u6570\uFF1A" + JSON.stringify(args));
                return oldValue && oldValue.apply(target, args);
            };
        }
        return value;
    };
}
var Foo = (function () {
    function Foo() {
    }
    return Foo;
}());
var Demo = (function () {
    function Demo() {
    }
    Demo.prototype.doSomething = function (param1, param2, param3, param4, param5, param6, param7) {
        return 1;
    };
    return Demo;
}());
__decorate([
    logDec({ path: "/a", method: "post" }),
    logDec({ path: "/a/b", method: "post" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Foo, Object, Object, Function, Function]),
    __metadata("design:returntype", Number)
], Demo.prototype, "doSomething", null);
var demo = new Demo();
var a = demo.doSomething("1", 2, new Foo(), { test: "3" }, { kind: "d" }, function () { }, function (a) { });
console.log(a);
//# sourceMappingURL=index.js.map