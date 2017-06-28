import { downloaderPlugin } from './index';

let down11 = downloaderPlugin({ downloader: { url: "http://www.yaolan.com" } })({}, () => { }).then((data) => {
    console.log(data);
}).catch((err) => {
    console.log("error:",err);
});