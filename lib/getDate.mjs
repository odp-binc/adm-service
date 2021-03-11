import { fix0 } from "./fix0.mjs";

const getDate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const date = d.getDate();
    //return y + "-" + fix0(m, 2) + "-" + fix0(date, 2) + "T" + fix0(h, 2) + ":" + fix0(min, 2);
    return "" + y + fix0(m, 2) + fix0(date, 2);
};
const getDateByHour = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const date = d.getDate();
    const h = d.getHours();
    const min = 0;
    //return y + "-" + fix0(m, 2) + "-" + fix0(date, 2) + "T" + fix0(h, 2) + ":" + fix0(min, 2);
    return "" + y + fix0(m, 2) + fix0(date, 2) + fix0(h, 2) + fix0(min, 2);
};
const getDateByTenMinutes = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const date = d.getDate();
    const h = d.getHours();
    const min = Math.floor(d.getMinutes() / 10) * 10;
    //return y + "-" + fix0(m, 2) + "-" + fix0(date, 2) + "T" + fix0(h, 2) + ":" + fix0(min, 2);
    return "" + y + fix0(m, 2) + fix0(date, 2) + fix0(h, 2) + fix0(min, 2);
};
const getDateByMilliseconds = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const date = d.getDate();
    const h = d.getHours();
    const min = d.getMinutes();
    const sec = d.getSeconds();
    const msec = d.getMilliseconds();
    //return y + "-" + fix0(m, 2) + "-" + fix0(date, 2) + "T" + fix0(h, 2) + ":" + fix0(min, 2);
    return "" + y + fix0(m, 2) + fix0(date, 2) + fix0(h, 2) + fix0(min, 2) + fix0(sec, 2) + fix0(msec, 3);
};

export { getDate, getDateByHour, getDateByTenMinutes, getDateByMilliseconds };
