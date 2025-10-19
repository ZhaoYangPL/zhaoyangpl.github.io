---
title: "Data Struct Notes(CourseNotes for Study & Research Only)"
date: 2025-10-11 14:10:00 +0800
categories: [Notes,Data Struct]  
tags: [Data Struct]
---

**写在最前面！写链表的时候千万不要忘记# include<stdlib.h>;不要忘记申请动态内存temp = (int*)malloc(sizeof(int)*m);不要忘记free();结构里所有的.改成->**

# 线性表

线性结构的特点： 同一种数据对象；只有一个首节点、尾结点；中间节点只有一个前驱，一个后继。

* 例子：稀疏多项式

![稀疏多项式](/assets/img/Course/DataStructure/稀疏多项式.png)

### 线性表的类型定义

![类型定义](/assets/img/Course/DataStructure/线性表的类型定义.png)

### 线性表的顺序表示

![](/assets/img/Course/DataStructure/线性表顺序表示.png)

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

![](/assets/img/Course/DataStructure/单链表.png)

#### 头结点(H->next==NULL)

![](/assets/img/Course/DataStructure/头结点.png)

![头结点的好处](/assets/img/Course/DataStructure/头结点的好处.png)

#### 循环链表 & 双向链表

![](/assets/img/Course/DataStructure/循环&双向.png)

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

```c
LNode *LocateELem(LinkList L，Elemtype e) { 
//在带头结点单链表L中查找值为e的元素
 //若找到返回指向该结点的指针，否则返回NULL
 LNode*p=L->next; //初始化p指向首元结点
while(p &&p->data!=e) //遍历单链表找值为e结点
p=p->next; 
return p; //p要么指向所找结点，要么为NULL
}
```

5. 单链表的插入

![](/assets/img/Course/DataStructure/单链表插入.png)

```c
Status ListInsert(LinkList &L,int i,ElemType e){ 
p=L; j=0; 
while( p && j < i-1) {
 p=p->next;
 ++j;
 } //寻找第 i-1个结点,即要插入结点的前驱结点
 if( !p || j > i-1)
 return ERROR; // i>n + 1或者i<1, 不合法
s=(LinkList)malloc(sizeof(LNode)); //生成新结点s 
s->data=e; //将结点s的数据域置为e
s->next=p->next; //将结点s插入L中
 p->next=s; 
return OK; 
}//ListInsert
```

6. 单链表的删除(删除单链表L的第i个元素,并由e返回值)

![](/assets/img/Course/DataStructure/单链表删除.png)

```c
Status ListDelete( LinkList &L,int i,ElemType &e) {
p=L;j=0; 
while( p->next && j<i-1 ){ //第i个结点前驱结点p
 p=p->next; 
 ++j; 
} 
if( !(p->next) || j>i-1 ) return ERROR; //删除位置不合理
 q=p->next; //q指向待删除结点，以备释放
 p->next=q->next; //改变删除结点前驱结点的指针域
e=q->data; //可保存被删结点的值，并带回
 free(q); //释放删除结点的空间
 return OK; 
}//ListDelete
```

7. 创建单链表

InitList()是创建一个只有头结点的空链表。

链表中各个元素（结点）是动态生成并插入到链表
中。即从空表开设，逐个生成结点并插入。

s=(LinkList)malloc(sizeof(LNode))的作用是生成
一个结点，s指向该结点。反之，free(s)的作用是
释放结点s的空间。

可多次通过调用函数 ListInsert(LinkList &L, int i, 
ElemType e) 实现，也可专门编写创建函数

链表可根据需要有不同的生成方式，包括：
 头(前)插法、尾(后)插法、有序插入法，其中，最
方便的是**头插法**。

![头插法](/assets/img/Course/DataStructure/头插.png)

```c
void CreateList_L(LinkList &L,int n) { 
 //逆序输入n个元素的值，头插法构建带头结点的单链表L
L= (LinkList)malloc(sizeof(LNode)); 
//L=new LNode;
L->next=NULL; //先建立一个带头结点的单链表
 for( i = n; i > 0; i--) { 
p=(LinkList)malloc(sizeof(LNode)); //生成新结点
 cin>>p->data;//scanf(&p->data); //输入值
 p->next=L->next;
 L->next=p; //插入到表头
 } 
}//CreateList_L
```
![尾插法](/assets/img/Course/DataStructure/尾插.png)

```c++
void CreateList_L(LinkList &L,int n){ 
//正位序输入n个元素的值，建立带表头结点的单链表L 
L=new LNode; // L= (LinkList)malloc(sizeof(LNode)); 
L->next=NULL; 
r=L; //尾指针r指向头结点
 for(i=0;i<n;++i){ 
p=new LNode; //生成新结点
 cin>>p->data; //输入元素值
 p->next=NULL; r->next=p; //插入到表尾
 r=p; //r指向新的尾结点
 } 
}//CreateList_L
```

### 循环链表

最大优势在于：**从表中任意一个结点出发都可找到表中其他结点**

![循环链表](/assets/img/Course/DataStructure/循环.png)

![循环合并](/assets/img/Course/DataStructure/循环合并.png)

### 双向链表

```c
typedef struct DuLNode{
 ElemType data;
 struct DuLNode *prior;
 struct DuLNode *next;
};
```

![双向空表](/assets/img/Course/DataStructure/双向空表.png)

![双向插入](/assets/img/Course/DataStructure/双向插入.png)

![双向删除](/assets/img/Course/DataStructure/双向删除.png)

***顺序表与链表的比较***

![顺序表与链表比较](/assets/img/Course/DataStructure/线性表与顺序表比较.png)

## 线性表的应用

* 一般线性表的合并

```c
Void MergeList( List &La , List Lb) {
// 将所有在线性表Lb中但不在La中的数据元素插入到La中
 La_len = ListLength( La );
Lb_len = ListLength( Lb ); //求线性表的长度
 for ( i = 1 ; i <= Lb_len ; i++) {
GetElem( Lb , i , e ); // 取Lb中第i个数据元素赋给e 
if ( !LocateElem( La , e )) ListInsert( La, ++La_len, e );
// La中不存在与e相同的数据元素，插入e
}
} // Union O(La_len*Lb_len)
```

* 有序顺序表的合并

```c
void MergeList_Sq(SqList LA,SqList LB,SqList &LC){ 
pa=LA.elem; pb=LB.elem; //指针pa和pb的初值分别指向两个表的第一个元素
 LC.length=LA.length+LB.length; //新表长度为待合并两表的长度之和
 LC.elem=new ElemType[LC.length]; //为合并后的新表分配一个数组空间
 pc=LC.elem; //指针pc指向新表的第一个元素
 pa_last=LA.elem+LA.length-1; //指针pa_last指向LA表的最后一个元素
 pb_last=LB.elem+LB.length-1; //指针pb_last指向LB表的最后一个元素
 while(pa<=pa_last && pb<=pb_last){ //两个表都非空
 if(*pa<=*pb) *pc++=*pa++; //依次“摘取”两表中值较小的结点 
else *pc++=*pb++; } 
 while(pa<=pa_last) *pc++=*pa++; //LB表已到达表尾
while(pb<=pb_last) *pc++=*pb++; //LA表已到达表尾
}//MergeList_Sq
```

* 有序链表的合并

```c
if(pa->data<=pb->data) {
pc->next=pa; pc=pa; pa=pa->next; }
else {
pc->next=pb; pc=pb; pb=pb->next;}
```