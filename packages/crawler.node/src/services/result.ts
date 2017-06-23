import { Service, InjectorService } from "ts-express-decorators";
import { Exception } from 'ts-httpexceptions';

/**
 * 返回固定格式的json数据
 */
export interface IResultData {
    code: number;
    message: string;
    dataMap: any;
}

/**
 * 基础信息的工厂服务
 */
export interface IResultService {
    /**
     * 获取成功的信息
     */
    getSuccessData: (result: any) => IResultData;
    /**
     * 获取失败的信息
     */
    getErrorData: (err: Error) => IResultData;
}

@Service()
export class ResultService implements IResultService {
    /**
     * 获取成功的信息
     * @param result 成功的数据
     */
    public getSuccessData(result: any) {
        return {
            code: 200,
            dataMap: result,
            message: ""
        };
    }

    /**
    * 获取失败的信息
    * @param error 异常的数据
    */
    public getErrorData(error: Exception) {
        return {
            code: ~~error.status,
            dataMap: error,
            message: error.message
        }
    }
}
