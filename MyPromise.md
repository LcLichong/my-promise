### 参考资料

> https://juejin.cn/post/6945319439772434469

### promies流程图

![Untitled Diagram](/Users/lc/Downloads/Untitled Diagram.svg)



##### 	`new Promise`时会传入一个`函数`作为执行器并立即执行，在`construct`里将`revolve`和`reject`关联到执行器。定义三个常量表示promise的三种状态（pending、fulfilled、rejected），默认状态为pending，声明value和reason保存resovle和reject传入的值。

```javascript
//先定义三个常量表示状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class MyPromise {
    constructor(executor) {
        // executor是一个执行器，进入会立即执行
        // 并传入resolve和reject方法
        try {
            executor(this.resolve, this.reject);
        } catch (error) {
            this.reject(error);
        }
    }
    // 储存状态的变量，初始值是pending
    status = PENDING;
    // 成功之后的值
    value = null;
    // 失败之后的值
    reason = null;
}
```

#####  `Promise`的状态只能通过`revolve`和`reject`改变，它们都是箭头函数，之后再说为什么用箭头函数

```javascript
// 更改成功后的状态
resolve = (value) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
        // 状态修改为成功
        this.status = FULFILLED;
        // 保存成功之后的值
        this.value = value;
    }
}

// 更改失败后的状态
reject = (reason) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
        // 状态成功为失败
        this.status = REJECTED;
        // 保存失败后的原因
        this.reason = reason;
    }
}
```

##### then方法，onFulfilled表示promise状态成功回调，onRejected表示promise状态失败回调

```javascript
then(onFulfilled, onRejected) {
    if(this.status === PENDING){
       //...
    } else if(this.status === FULFILLED){
       // primise状态为成功，走onFulfilled回调，传入resovle设置的value
       onFulfilled(this.value);   
    } else{
       // primise状态为失败，走onRejected回调，传入reject设置的value
       onRejected(this.reason);
    }
}
```

##### 一个最基本的promise就完成了，下面我们来是试试，成功打印success和error

```javascript
const MyPromise = require('./MyPromise')

const promiseA = new MyPromise((resolve, reject) => {
    resolve('success')
})
promiseA.then(value => {
    // success
    console.log('value', value)
})

const promiseB = new MyPromise((resolve, reject) => {
    reject('error')
})
promiseB.then(value => {
    console.log('value', value)
},reason => {
    // reason
    console.log('reason', value)
})
```

##### 但它不能满足resolve或reject异步执行的情况

```javascript
const MyPromise = require('./MyPromise')

const promiseA = new MyPromise((resolve, reject) => {
    // 三秒后并没有执行then方法
    setTimeout(() => {
       resolve('success')
    },3000)
})
promiseA.then(value => {
    // success
    console.log('value', value)
})
```

##### 这里就要用到观察者模式了（或者叫发布订阅）,先定义两个数组分别存放成功回调和失败回调，然后我们需要修改一下then方法

```javascript
class MyPromise {
    // 存储成功回调函数
    onFulfilledCallbacks = [];
    // 存储失败回调函数
    onRejectedCallbacks = [];

    then(onFulfilled, onRejected) {
        if(this.status === PENDING){
            // 因为我们不知道promise将会是什么状态，所以把两个回调都存起来
			this.onFulfilledCallbacks.push(onFulfilled);
            this.onRejectedCallbacks.push(onRejected);
        } 
    }
}

```

##### 然后我们需要修改resovle和reject，通过while遍历回调数组，通过shift函数取出后，数组将失去该元素，直到数组为空，这样每个回调函数都会执行一遍最后清空数组。

```javascript
// 更改成功后的状态
resolve = (value) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
        // 状态修改为成功
        this.status = FULFILLED;
        // 保存成功之后的值
        this.value = value;
        // ==== 新增 ====
        // 判断成功回调是否存在，如果存在就调用
        while(this.onFulfilledCallbacks.length){
              this.onFulfilledCallbacks.shift()(value);
        }
    }
}

// 更改失败后的状态
reject = (reason) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
        // 状态成功为失败
        this.status = REJECTED;
        // 保存失败后的原因
        this.reason = reason;
        // ==== 新增 ====
        // 判断失败回调是否存在，如果存在就调用
        while (this.onRejectedCallbacks.length) {
            this.onRejectedCallbacks.shift()(reason);
        }
    }
}
```

##### 这时再异步resovle、reject，就会成功

```javascript
const MyPromise = require('./MyPromise')

const promiseA = new MyPromise((resolve, reject) => {
    // 三秒后执行then方法
    setTimeout(() => {
       resolve('success')
    },3000)
})
promiseA.then(value => {
    // ...
})
```

##### 接着我们要实现then的链式调用

```javascript
new Promise.then().then().then()
```

##### 这里可以思考一下，怎么实现？既然是链式调用then，返回的对象也必须有then方法才行，那么我们直接在then方法里返回一个新的promise不就好了，下面我们修改一下then方法

```javascript
then(onFulfilled, onRejected) {
    let promise = new MyPromise((resolve,reject) => {
        if(this.status === PENDING){
            this.onFulfilledCallbacks.push(onFulfilled);
            this.onRejectedCallbacks.push(onRejected);
        } else if(this.status === FULFILLED){
            onFulfilled(this.value);   
        } else{
            onRejected(this.reason);
        }
    })
    return promise;
}
```









​	

   

