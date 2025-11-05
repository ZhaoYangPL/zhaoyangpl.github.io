---
title: "Celection of Wrong Questions of Data Struct(CourseNotes for Study & Research Only)"
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