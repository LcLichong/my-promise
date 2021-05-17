// test.js

const MyPromise = require('./MyPromise')

const promise = new MyPromise((resolve, reject) => {
    resolve('success')
    // throw new Error('执行器错误')
})

function other() {
    return new MyPromise((resolve, reject) => {
        reject('error');
    })
}

// 第一个then方法中的错误要在第二个then方法中捕获到
promise.then(value => {
    console.log('then1', value)
    return other();
}).then(value => {
    console.log('then2', value)
}, reason => {
    console.log('reason2', reason)
    return 1;
}).then(value => {
    console.log('then3', value)
})


// const p1 = new MyPromise(function (resolve, reject) {
//     setTimeout(() => {
//         resolve('p1');
//     },3000)
// });
//
// const p2 = new MyPromise(function (resolve, reject) {
//     resolve(p1);
// })
//
// p2.then(value => {
//     console.log('value',value);
// },reason => {
//     console.log(reason);
// })


// const p1 = new MyPromise((resolve,reject) => {
//     resolve('a');
// })
//
// p1.then(res => {
//     console.log('res',res);
// })