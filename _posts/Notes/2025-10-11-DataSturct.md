---
title: "Data Struct Notes(CourseNotes for Study & Research Only)"
date: 2025-10-11 14:10:00 +0800
categories: [Notes,Data Struct]  
tags: [Data Struct]
---

## 线性表

线性结构的特点： 同一种数据对象；只有一个首节点、尾结点；中间节点只有一个前驱，一个后继。

* 例子：稀疏多项式

![稀疏多项式](/zhaoyang.github.io/assets/img/Course/稀疏多项式.png)

**线性表的类型定义**

![类型定义](/zhaoyang.github.io/assets/img/Course/线性表的类型定义.png)

### 线性表的顺序表示

![](/zhaoyang.github.io/assets/img/Course/线性表顺序表示.png)

可以用动态数组表示：
```c
#define MAXSIZE 100 //最大长度
typedef struct { 
ElemType *elem; //动态存储空间的首地址，即数组名
 int length; //当前元素的个数，最后一个下标为length-1
} SqList；
```

```c
typedef int ElemType
typedef stuct{
    ElemType *elem; 
    int length;
}SqList;

void main() {
SqList L;
L.elem = (ElemType*) 
malloc(MAXSIZE * sizeof(ElemType));
//L.elem=new ElemType[MAXSIZE];
L.elem[0] = 15; L.elem[1] = 5; L.elem[2] = 22; 
L.length = 3;
……..
free(L.elem);
}
```

### 基本操作的实现

1. 初始化线性表

```c
Status InitList(SqList &L){ //构造一个空的顺序表L
//为顺序表分配空间
 L.elem= (ElemType*)
malloc(MAXSIZE * sizeof(ElemType)); 
// L.elem=new ElemType[MAXSIZE];
 if(!L.elem) exit(OVERFLOW); //存储分配失败
 L.length=0; //空表长度为0
return OK;
} //InitList
```

2. 销毁线性表

```c
void DestroyList(SqList &L)
{
 if (L.elem) free(L.elem) ; //释放存储空间
// if (L.elem) delete[]L.elem;
L.elem=NULL;
 L.length=0;
}
```

3. 清空线性表

```c
void ClearList(SqList &L) 
{
L.length=0; //将线性表的长度置为0
}
```

4. 取值（获取第i个元素）

```c
Status GetElem(SqList L,int i,ElemType &e)
{
if (i<1||i>L.length) return ERROR;
//判断i值是否合理，若不合理，返回ERROR
e=L.elem[i-1]; // 下标为i-1的单元存储着第i个数据
 return OK;
}
```

5. 定位值为e的元素（最坏情况与平均情况均是O(n)）

```c
int LocateELem(SqList L, ElemType e)
{ //在顺序表L中顺序查找值为e的元素，返回其序号
for (i=0; i< L.length; i++)
if (L.elem[i]==e) return i+1; 
return 0; //查找失败
}
```

6. 在第i个元素前插入元素e

```c
Status ListInsert(SqList &L, int i , ElemType e) {
if (i<1 || i>L.length+1) return ERROR; //i值不合法
if ( L.length ==MAXSIZE ) return ERROR; //空间已满
for (j=L.length-1; j>=i-1; j--) 
L.elem[j+1]=L.elem[j]; //插入位置及之后的元素后移
 
L.elem[i-1]=e; //将新元素e放入第i个位置
 ++L.length; //表长增1
return OK;
}
```

**算法思想**

（1）判断插入位置i 是否合法（1<=i<=n+1）。

（2）判断顺序表的存储空间是否已满，若满，则出错。 

（3）将线性表第n至第i 位的元素依次向后移动一个位
置，空出第i个位置。

（4）将要插入的新元素e放入第i个位置。

（5）表长加1，插入成功返回OK。

