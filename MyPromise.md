## Promise流程的理解

### Promise流程图 

![Untitled Diagram](https://github.com/LcLichong/my-promise/blob/master/static/promise.svg)

##### 	`new Promise`时会传入一个`函数`作为执行器并立即执行，在`construct`里将`revolve`和`reject`关联到执行器。定义三个常量表示promise的三种状态（pending、fulfilled、rejected），默认状态为pending，声明value和reason变量保存resovle和reject传入的值。

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

#####  `Promise`的状态只能通过`revolve`和`reject`改变，它们都是箭头函数，为什么不使用普通函数定义呢，在resolvePromise函数会解释，这里先跳过

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
    resolve('success');
})
promiseA.then(value => {
    // success
    console.log('value', value);
})

const promiseB = new MyPromise((resolve, reject) => {
    reject('error');
})
promiseB.then(value => {
    console.log('value', value);
},reason => {
    // reason
    console.log('reason', reason);
})
```

##### 但它不能满足resolve或reject异步执行的情况

```javascript
const promiseA = new MyPromise((resolve, reject) => {
    // 三秒后并没有执行then方法
    setTimeout(() => {
       resolve('success');
    },3000)
})
promiseA.then(value => {
    // success
    console.log('value', value);
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

##### 然后我们需要修改resovle和reject，通过while遍历回调数组，再通过shift函数取出后，数组将失去该元素，直到数组为空，这样每个回调函数都会执行一遍最后清空数组。

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

##### 这时再异步resovle或者reject，就会成功

```javascript
const promiseA = new MyPromise((resolve, reject) => {
    // 三秒后执行then方法
    setTimeout(() => {
       resolve('success');
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

##### 我们测试一下，会发现只输出了value1，后面的then方法并没有执行

```javascript
const promiseA = new MyPromise((resolve, reject) => {
    resolve('success1');
})
promiseA.then(value => {
    console.log('value1',value);
}).then(value => {
    console.log('value2',value);
}).then(value => {
    console.log('value2',value);
})
```

##### 这是因为虽然每次调用then都会返回一个新的promise，但它的状态一直还是默认的pending，所以除了第一个then方法以外，后面的then方法都不会走else if(this.status === FULFILLED)

```javascript
then(onFulfilled, onRejected) {
    let promise = new MyPromise((resolve,reject) => {
        if(this.status === PENDING){
            // ...
        } else if(this.status === FULFILLED){
            onFulfilled(this.value);   
        } else{
            // ...
        }
    })
    return promise;
}
```

##### 思考一下如果第一个`promise`的状态是`fulfilled`，怎么把状态传递给`then`产生的其他`promise`，我们新增一个`resolvePromise`方法，假设第一个`then`调用时`this.status === FULFILLED`，定义变量`x`接收`onFulfilled`回调函数的返回值，调用`resolvePromsie`方法传递`x、resolve、reject`参数，在`resolvePromsie`方法里执行`resolve(x)`，这里的`resolve`是`then`方法里`new MyPromise`的`resolve`，可以通过它改变`then`里返回的`promise`的状态，这样每个`then`返回的`promise`状态都是`fulfilled`了

##### 这里解释一下为什么`resolve`要设计成箭头函数而不是普通函数，箭头函数它没有自己的`this`对象，内部的`this`就是一个普通变量，指向定义时上层函数所在的对象，所以`resolve`函数的this始终都指向`MyPromise`，如果使用普通函数，`this`指向是根据执行时的环境定义的，resolve()直接调用的话，`this`就指向`window`了(非严格模式)(严格模式指向`undefined`)

```javascript
class MyPromise{
    // ...
    then(onFulfilled, onRejected) {
        let promise = new MyPromise((resolve,reject) => {
            if(this.status === PENDING){
                // ...
            } else if(this.status === FULFILLED){
                x = onFulfilled(this.value);
                resolvePromise(x,resolve,reject);
            } else{
                x = onRejected(this.reason);
                resolvePromise(x,resolve,reject);
            }
        })
        return promise;
    }
}

function resolvePromise(x,resolve,reject){
    // x等于onFulfilled或onRejected的返回值，再通过resolve方法改变then里面返回的promise的状态
    resolve(x);
}
```

##### 我们再试试`then`链式调用

```javascript
const promiseA = new MyPromise((resolve, reject) => {
    resolve('success1');
})

promiseA.then(value => {
    console.log('value1',value);
}).then(value => {
    console.log('value2',value);
}).then(value => {
    console.log('value3',value);
})
/*
	这里value2和value3输出都是undefined，是因为then方法都没有返回值
	value1 success
	value2 undefined
	value3 undefined
*/

promiseA.then(value => {
    console.log('value1',value);
    return 'success2';
}).then(value => {
    console.log('value2',value);
    return 'success3';
}).then(value => {
    console.log('value3',value);
})
/*
	成功输出
	value1 success
	value2 success2
	value3 success3
*/
```

##### 但是这里忽略了另一种情况，`then`的返回值也可能是一个状态为`fulfilled`或者`rejected`的`promise`

```javascript
let promise = new MyPromise((resolve, reject) => {
    resolve('success');
})

promise.then(value => {
    console.log('value', value);
    return new MyPromise((resolve, reject) => {
        reject('error');
    })
}).then(value => {
    console.log('value1', value);
}, reason => {
    console.log('reason', reason);
})

/*
	value success
	value1 MyPromise {status: "rejected", value: "", reason: "error", resolve: ƒ, reject: ƒ, …}
*/ 
```

##### 第二次`then`并没有走状态为`rejected`的回调，还是走的`fulfilled`的回调，回调的值也不对，直接输出了`promise`实例，很明显在`resolvePromise`里直接就调用`resolve`是不对的

```javascript
function resolvePromise(x,resolve,reject){
    resolve(x);
}
```

##### 修改一下`resolvePromise`，我们需要判断`x`是不是一个`promise`实例

```javascript
function resolvePromise(x,resolve,reject){
    // 用instanceof判断x的原型链是否关联MyPromise
    if(x instanceof MyPromise){
        // ...
    }else {
    	resolve(x);
    }
}
```

##### 如果`x`是一个`promise`实例，那么它的默认状态是`pending`，未来可能是`fulfilled`或者`rejected`，这里还是交给`then`

```javascript
function resolvePromise(x, resolve, reject) {
    if (x instanceof MyPromise) {
        x.then(resolve, reject);
    } else {
        resolve(x);
    }
}
```

##### 这里有几个点我们需要关注：

##### 	1. `x.then(resolve, reject)`里的`resolve`和`reject`，其实是上一个`then`里`new MyPromise（叫它promiseB）`的`resolve`和`reject`，等到执行`resolve`或`reject`时其实是调用`promiseB的resolve或reject`，完成了`promiseB`的状态改变

##### 	2. `x.then`函数里的`this`指向`x`

##### 	3. `x.then` 会产生了一个新的  `promise`，状态为`pending`

##### 我们用代码展现一下过程：

```javascript
//  new MyPromise的实例，状态为fulfilled，叫它promiseA
let promise = new MyPromise((resolve, reject) => {
    resolve('success');
})

promise.then(value => {
    console.log('value', value);
    return new MyPromise((resolve, reject) => {
        reject('error');
    })
}).then(value => {
    // ...
}, reason => {
    console.log('reason', reason);
})

/*
	this = promiseA
*/
then(onFulfilled, onRejected) {
    // then里new MyPromise的实例，叫它promiseB
    let promise = new MyPromise((resolve, reject) => {
        if (this.status === PENDING) {
            // ...
        } else if (this.status === FULFILLED) {
            // promiseA的status等于FULFILLED
            // 走onFulfilled回调
            x = onFulfilled(this.value);
            /*
                onFulfilled回调
                value => {
                	console.log('value', value)
                    return new MyPromise((resolve, reject) => {
                        reject('error')
                    })
                    // 返回一个新的Promise实例，状态为rejected，reason为error，叫它promiseC
                }
            */ 
            resolvePromise(x, resolve, reject);
        } else {
            // ...
        }
    })
    return promise;
}

/*
	接着走resolvePromise
	x = promiseC
	resolve = promiseB.resolve
	reject = promiseB.reject
*/ 
function resolvePromise(x, resolve, reject) {
    // 因为 x 也是promise实例，走if
    if (x instanceof MyPromise) {
        /*
        	执行x.then
        	这里的x.then(resolve, reject)
        	其实是promiseC.then(promiseB.resolve, promiseB.reject)
        */ 
        x.then(resolve, reject);
    } else {
        // ...
    }
}

/*
	this = x = promiseC
	onFulfilled = promiseB.resolve
	onRejected =  promiseB.reject
*/
then(onFulfilled, onRejected) {
    // then里new MyPromise的实例，叫它promiseD
    let promise = new MyPromise((resolve, reject) => {
        if (this.status === PENDING) {
            // ...
        } else if (this.status === FULFILLED) {
			// ...
        } else {
            /*
           	   这里this指向x，x代表promiseC，promiseC.status是rejected
           	   onRejected = promiseB.reject
           	   this.reason = x.reason = promiseC.reason = error
            */ 
            x = onRejected(this.reason);
            /*
               onRejected其实是promiseB.reject
               执行完onRejected，promiseB的状态变更为rejected，promiseB.reason等于promiseC.reason，也就是error
               onRejected没有返回值，所以 x = undefined
            */ 
            resolvePromise(x, resolve, reject);
            /*
               接着走resolvePromise(x, resolve, reject)
               实际传递的参数，resolvePromise(undefined, promiseD.resolve, promiseD.reject)
            */ 
        }
    })
    return promise;
}

/*
	x = undefined
	resolve = promiseD.resolve
	reject = promiseD.reject
*/
function resolvePromise(x, resolve, reject) {
    // x 等于 undefined，走else
    if (x instanceof MyPromise) {
		// ...
    } else {
        resolve(x)
        /*
           promiseD.resolve(undefined)
           promiseD的状态变成为fulfilled
        */ 
    }
}

/*
	这里promiseC和promiseD的流程也就走完了
	promiseC把状态通过x.then传递给了promiseB
	回到promiseA.then方法
	返回了promiseB实例
*/
then(onFulfilled, onRejected) {
    // then里new MyPromise的实例，叫它promiseB
    let promise = new MyPromise((resolve, reject) => {
       // ...
    })
    return promise;
    // 返回的promiseB状态也变更为rejected了
}

/*
	接着走promsieB.then，因为状态是rejected，走then的第二个回调
*/
let promise = new MyPromise((resolve, reject) => {
    resolve('success');
})

promise.then(value => {
    console.log('value', value);
    return new MyPromise((resolve, reject) => {
        reject('error');
    })
}).then(value => {
    // promiseB.fuilflled
}, reason => {
    // promiseB.rejected
    console.log('reason', reason);
    // 打印 reason error
})
```


