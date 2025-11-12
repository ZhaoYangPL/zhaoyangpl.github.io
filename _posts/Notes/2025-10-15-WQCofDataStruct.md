---
title: "Selection of Wrong Questions of Data Struct(CourseNotes for Study & Research Only)"
date: 2025-10-15 20:35:00 +0800
categories: [Notes,Data Struct]  
tags: [Data Struct,CWQ]
---

对一个具有n个元素的线性表，建立其单链表的时间复杂度为（）。

A. O(n)

理由： 建立单链表需要遍历n个元素，每遍历一个元素就生成一个新结点并将其插入链表中。处理每个元素的时间是常数 O(1)，总共n个元素，所以总时间复杂度为 O(n)。

已知头指针 h 指向一个带头结点的非空单循环链表，结点结构为 data | next，其中 next 是指向直接后继结点的指针，p 是尾指针，q 是临时指针。现要删除该链表的第一个元素，正确的语句序列是：


A.
h->next=h->next->next; q=h->next; free(q);


B.
q=h->next; h->next=h->next->next; free(q);


C.
q=h->next; h->next=q->next; if (p!=q) p=h; free(q);


D.
q=h->next; h->next=q->next; if (p==q) p=h; free(q);

D. q=h->next; h->next=q->next; if (p==q) p=h; free(q);

理由：

q=h->next; 让q指向第一个元素。

h->next=q->next; 让头结点跳过第一个元素，指向第二个元素。

if (p==q) p=h; 这是关键的边界条件处理。如果链表中只有一个元素，那么 p (尾指针) 和 q (第一个元素) 是同一个结点。删除后链表变空，此时尾指针 p 应该指向头结点 h。

free(q); 释放被删除的结点空间。

所谓“循环队列”是指用单向循环链表或者循环数组表示的队列。

T
F

* 循环队列指的就是循环数组，通过去余数来实现循环。与链表无关

![](/assets/img/Course/DataStructure/数据结构的逻辑结构与存储结构.png)

![](/assets/img/Course/DataStructure/线性表属于逻辑结构.png)

解题思路：
逻辑结构描述数据元素之间的逻辑关系（如线性关系、树形关系等），而不关心数据在计算机中的具体存储方式。有序表是一种逻辑结构，因为它定义了元素之间按特定顺序（如升序或降序）排列的关系，例如有序线性表。

其他选项属于存储结构（或物理结构），即数据在计算机内存中的实现方式：

A. 顺序表：基于数组的顺序存储结构。

B. 散列表：基于哈希函数的存储结构。

D. 单链表：基于指针的链式存储结构。

![](/assets/img/Course/DataStructure/时间复杂度.png)

不要把N*3看成N**3

![](/assets/img/Course/DataStructure/具体数据给定的特殊情况.png)

详细解释如下：
时间复杂度衡量的是**算法执行时间随数据规模增长的变化趋势**。它的核心是看循环等操作次数是否随某个变量的变化而变化。

在这段代码中，循环的终止条件是 i != n，而 n在程序一开始就被明确赋值为一个常数 100。

因此，无论这个程序运行多少次，循环都会从 i=1开始，每次增加1，直到 i等于 100时结束。

循环体固定执行了 99 次。这是一个确定的、固定的次数。

由于执行次数是一个常数，不随任何输入规模的改变而改变，所以它的时间复杂度是 O(1)，也就是常数时间复杂度。

![](/assets/img/Course/DataStructure/链表不具有的特点.png)

![](/assets/img/Course/DataStructure/首尾指针循环列表删除元素判断删除的是否是尾指针.png)

![](/assets/img/Course/DataStructure/判断顺序栈为空.png)

![](/assets/img/Course/DataStructure/循环队列指的就是顺序存储.png)
