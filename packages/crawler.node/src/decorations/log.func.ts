import { $log } from 'ts-log-debug';

/**
 * 记录方法调用日志的装饰器Log
 * 调用元方法
 * 记录方法的调用参数以及返回值
 */
export const Log = () => {
    return (target: any, key: string, descriptor: PropertyDescriptor) => {
        let originalMethod = descriptor.value;

        // 覆盖value
        descriptor.value = function (...args: any[]) {
            let a = args.map(a => JSON.stringify(a)).join();
            let result = originalMethod.apply(this, args);
            let r = JSON.stringify(result);

            $log.trace(`Call: ${key}(${a}) => ${r}`);

            return result;
        }

        return descriptor;
    }
}