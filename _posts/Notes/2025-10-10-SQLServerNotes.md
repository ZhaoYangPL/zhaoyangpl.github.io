---
title: "SQL Server Notes"
date: 2025-10-10 13:00:00 +0800
categories: [Notes,Database]  
tags: [Database]
---

**as操作符的使用场景：**

1. 查询中使用了函数

2. 将多个列合成到一个列

```
SELECT CustomerName, Address + ', ' + PostalCode + ' ' + City + ', ' + Country AS Address
FROM Customers;
```

3. 涉及多个表

```
SELECT o.OrderID, o.OrderDate, c.CustomerName
FROM Customers AS c, Orders AS o
WHERE c.CustomerName= ‘Xixian PENG' AND c.CustomerID=o.CustomerID;
```

**select语句（限定查询结果）：**

1. 限定行数

```
SELECT TOP 2 id, name, enrollment_date FROM Students;
```

2. 限定比例

```
SELECT TOP 1 PERCENT id, name, enrollment_date FROM Students;
```

**一定要记得where语句是放在group by 和 order by 前面的**
![](/assets/img/Course/select语句.png)

**注意where子句中等于是=，不等是<>**

**一些特殊的查找方法：**

1. between ... and ... 

```
SELECT * FROM Students
WHERE enrollment_date BETWEEN '2023-08-01'
AND '2023-08-31’;

值得注意的是Data类型的数值可以比较大小
```

2. in(...,...)
```
SELECT * FROM Students WHERE age IN (18, 20, 25);

在多值匹配的时候尤其方便
```

3. **模糊查找**

百分号在哪边哪边就可以替换哪边
![](/assets/img/Course/模糊查找.png)

4. 查找空值(不可以用‘**= NULL**’，要用‘**is NULL**’)

```
WHERE enrollment_date IS NULL
```

**NOT 可以加在任何条件前用来表示相反的条件**

**查询结果排列**

1. 升降序：
默认升序排列，若要降序需DESC

```
SELECT * FROM Students
ORDER BY enrollment_date DESC;

-- 先按性别升序，再按年龄降序
SELECT name, gender, age
FROM Students
ORDER BY gender ASC, age DESC;
```

2.按表达式：

```
-- 按名字长度排序
SELECT name, LEN(name) AS name_length
FROM Students
ORDER BY LEN(name) DESC;
```

**聚集函数**
![](/assets/img/Course/聚集函数.png)

![](/assets/img/Course/聚集函数规则.png)

**Group By**
![](/assets/img/Course/group%20by规则.png)

**Having**
![](/assets/img/Course/Having.png)

![](/assets/img/Course/Having子句规则.png)

***where语句不能使用聚集函数，Having语句必须使用聚集函数；select的列必须出现在Having语句或者group by语句中；先where在group by***