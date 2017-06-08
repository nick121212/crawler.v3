import 'reflect-metadata';

function logType(target: any, key: string) {
    var t = Reflect.getMetadata("design:type", target, key);


    console.log(target);
    console.log(`${key} type: ${t.name}`);
}

function logParamTypes(target: any, key: string) {
    var types = Reflect.getMetadata("design:paramtypes", target, key);
    var s = types.map((a: any) => a.name).join();
    console.log(`${key} param types: ${s}`);
}

function logReturnType(target: any, key: string) {
    var t = Reflect.getMetadata("design:returntype", target, key);

    console.log(`${key} type: ${t.name}`);
}

function logDec(config: { path: string, method: string }) {
    return (target: any, name: string, value: PropertyDescriptor) => {
        let oldValue = value.value;

        if (value && value.value) {
            value.value = (...args: Array<any>) => {

                console.log(`路由：${config.path}，路由方法：${config.method},参数：${JSON.stringify(args)}`);

                return oldValue && oldValue.apply(target, args);
            };
        }

        return value;
    }
}

/** 
  * Basic shape for a type.
  */
interface _Type {
    /** 
      * Describes the specific shape of the type.
      * @remarks 
      * One of: "typeparameter", "typereference", "interface", "tuple", "union", 
      * or "function".
      */
    kind: string;
}

class Foo { }
interface IFoo extends _Type { }

class Demo {
    public attr1: string;

    @logDec({ path: "/a", method: "post" })
    @logDec({ path: "/a/b", method: "post" })
    doSomething(
        param1: string,
        param2: number,
        param3: Foo,
        param4: { test: string },
        param5: IFoo,
        param6: Function,
        param7: (a: number) => void,
    ): number {
        return 1;
    }

    constructor() {

    }
}

let demo = new Demo();

let a = demo.doSomething("1", 2, new Foo(), { test: "3" }, { kind: "d" }, () => { }, (a: number) => { });

console.log(a);