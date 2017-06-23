import * as superAgent from "superagent";

/**
 * 
 */
export class SuperAgentDownloader {
    private request = superAgent;

    constructor() {
    }

    /**
     * 设置代理
     */
    setProxy(options, request) {
        if (!options || !options.useProxy) {
            return;
        }

        options.httpProxy && request.proxy(options.httpProxy);
    }

    /**
     * 设置重试次数
     */
    setRetry(options, request) {
        if (!options) return;
        request.retry(options.count || 1);
    }

    /**
     * 设置编码
     */
    setCharset(options, request) {
        if (!options) return;
        request.charset(options.charset || 1);
    }

    /**
     * 设置超时时间
     */
    setTimeout(options, request) {
        if (!options) return;
        request.timeout(options.timeout || 5000);
    }

    /**
     * 发送get请求
     */
    fetch(uri, options = { retry: 0, timeout: 0, proxy: "", charset: "" }) {
        let requestObject = this.request.get(uri);

        // this.setRetry(options.retry, requestObject);
        // this.setTimeout(options.timeout, requestObject);
        // this.setProxy(options.proxy, requestObject);
        // this.setCharset(options.charset, requestObject);

        return requestObject;
    }
}

export default new SuperAgentDownloader();