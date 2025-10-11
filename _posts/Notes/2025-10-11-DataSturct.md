---
title: "Data Struct Notes(CourseNotes for Study & Research Only)"
date: 2025-10-11 14:10:00 +0800
categories: [Notes,Data Struct]  
tags: [Data Struct]
---

**写在最前面！写链表的时候千万不要忘记# include<stdlib.h>;不要忘记申请动态内存temp = (int*)malloc(sizeof(int)*m);不要忘记free()**

# 线性表

线性结构的特点： 同一种数据对象；只有一个首节点、尾结点；中间节点只有一个前驱，一个后继。

* 例子：稀疏多项式

![稀疏多项式](/assets/img/Course/稀疏多项式.png)

**线性表的类型定义**

![类型定义](/assets/img/Course/线性表的类型定义.png)

### 线性表的顺序表示

![](/assets/img/Course/线性表顺序表示.png)

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
***
## 顺序表

### 顺序表的特点
（1）逻辑关系上相邻的两个元素在**物理位置上也相邻**。即线性表的逻辑结构与存储结构一致
顺序表（顺序存储结构）的特点
这种存取元素的方法被称为**随机存取法**

（2）在访问线性表时，可以快速地计算出任何一
个数据元素的存储地址。因此可以粗略地认为，
**访问每个元素所花时间相等**

（3）存储密度大，空间利用率高

（4）插入、删除每一元素时，需要移动大量元素

（5）浪费存储空间

### 顺序表基本操作的实现

1. 初始化顺序表

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

6. 在第i个元素前插入元素e O(n)

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

7. 将第i个元素删除 O(n)

```c
Status ListDelete(SqList &L, int i,ElemType &e) {
if ((i<1)||(i>L.length)) return ERROR; //i值不合法
e=L.elem[i-1]; //被删元素值赋给e，带回
 for (j=i; j<=L.length-1; j++) 
 L.elem[j-1]=L.elem[j]; //被删除元素之后的元素前移 
 --L.length; //表长减1
return OK;
}
```

**算法思想**

（1）判断删除位置i 是否合法（合法值为1≤i≤n）。

（2）将第i+1至第n 位的元素依次向前移动一个位置。

（3）表长减1，删除成功返回OK。

***

## 链式表

### 链式表的特点

（1）不要求逻辑上相邻的元素在物理位置
 上也相邻，可以用任意的存储单元存储数据元素， 元素之间的逻辑关系通过指针指向后继结点来表示。

（2）插入或删除非常方便，但不能随机存取，只能沿着链一个个搜索，即顺序存取。

#### 单链表

![](/assets/img/Course/单链表.png)

#### 头结点(H->next==NULL)

![](/assets/img/Course/头结点.png)

![头结点的好处](/assets/img/Course/头结点的好处.png)

#### 循环链表 & 双向链表

![](/assets/img/Course/循环&双向.png)

### 单链表的定义与表示

```c
typedef struct LNode {
 ElemType data;
 struct LNode *next;
 } LNode, *LinkList;
```

### 单链表的基本操作

1. 初始化(空表)

```c
Status InitList(LinkList &L){ 
 L=(LinkList)malloc(sizeof(LNode));
//L=new Lnode; 
 L->next=NULL;
 return OK; 
}
```

**算法思想**

（1）生成新结点作头结点，用头指针L指向头结点。

（2）头结点的指针域置空。

2. 清空单链表

```c
Status ClearList(LinkList & L){ // 将L重置为空表
 LinkList p,q;
p=L->next; //p指向第一个结点
 while(p) //没到表尾
 { q=p->next; 
 free(p); 
 p=q; 
 }
L->next=NULL; //头结点指针域为空
 return OK;
}
```

3. 求表长

```c
int ListLength(LinkList L) {
//返回L中数据元素个数
LinkList p; int i=0;
p=L->next; //p指向第一个结点
while(p) { //遍历单链表,统计结点数
 i++;
p=p->next; 
}
return i; 
}
```

4. 查找（定位）

* 取线性表L中第i个元素

```c
Status GetElem(LinkList L,int i,ElemType &e){
 //取带头结点单链表L中第i个元素值，由e带回
p=L->next; //初始化，p指向首元结点
 j=1; //初始化，计数器j为1，当前第 1 个
 while( p&&j<i ){ //直到p为空或指向第i个元素
 p=p->next; //p往后走，指向下一个
 ++j; 
} 
if(!p || j>i)return ERROR; // i值不合法，不存在
 e=p->data; //取第i个元素
 return OK; 
}//GetElem
```

* 查找值为e的数据元素