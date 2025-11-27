//p-147 赫夫曼树和赫夫曼编码的存储表示
//#include <iostream.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define  TRUE 1
#define  FALSE 0
//#define  NULL 0
#define  OVERFLOW -2
#define  OK    1
#define  ERROR 0

typedef int Status;

typedef struct { 
	unsigned int weight;
	unsigned int parent,lchild,rchild;
} HTNode, *HuffmanTree;  //结构和结构指针，用于动态分配结构数组存储赫夫曼树

typedef char **HuffmanCode; //字符指针的指针，用于动态分配指针数组存储赫夫曼编码表

void HuffmanCoding(HuffmanTree &HT, HuffmanCode &HC, int *w, int n)
{  // w指向存放 n 种字符的权值(均>0)的数组
   // HT 为构造的赫夫曼树，HC 为求出的n个字符的赫夫曼编码。 
   int m,i,j,s1,s2,start,f,t,k=0;
   unsigned int c;
   char *cd;
   HuffmanTree p;

   if(n<=1) return;
   m=2*n-1;
   HT = (HuffmanTree)malloc((m+1)*sizeof(HTNode)); //0号单元不用
 
   // 赫夫曼树初始
   for(p=HT+1,i=1;i<=n;++i,++p,++w)  //初始化
           //  相当于{  *P={*w,0,0,0};   }
   { p->weight=*w; p->parent=0; p->lchild=0; p->rchild=0;}
   for(;i<=m;++i,++p)  //初始化n个单元后的数值,即为分支结点赋初值
          //   相当于{  *P={0,0,0,0};   }
   { p->weight=0; p->parent=0; p->lchild=0; p->rchild=0;}
   printf(" N weight parent lchild rchild\n");//显示初始赫夫曼树
   for(i=1; i<=m; i++) 
     printf("%2u     %2u     %2u     %2u     %2u   \n",i,HT[i].weight,HT[i].parent,HT[i].lchild,HT[i].rchild);
   
   // 建赫夫曼树
   for(i=n+1;i<=m;++i)
   {  // Select(HT,i-1,s1,s2); 
      // 在HT[1..i-1]选择parent为0且weight最小的两个结点，其序号分别为s1和s2。
	  unsigned int min1=99, min2=99;

	  for(int j=1;j<=i-1;j++)
		{  if ((HT[j].parent==0 )&& (HT[j].weight < min1)) 
			{ min1=HT[j].weight; s1=j; }
		}
	  HT[s1].parent=i;
	  // 以上找到第一个结点,以下循环找第二个
	  for(j=1;j<=i-1;j++)
		{  if ((HT[j].parent==0) && (HT[j].weight < min2)) 
			{ min2=HT[j].weight; s2=j; }
		}
	  printf("s1=%d,s2=%d\n",s1,s2);getchar();
	  HT[s2].parent=i;    
	  HT[i].lchild=s1; HT[i].rchild=s2;//在本程序中，左子树根结点的权值小于右子树根结点权值
	  HT[i].weight=HT[s1].weight+HT[s2].weight;
   }
  
   printf(" N weight parent lchild rchild\n");//显示建成赫夫曼树
   for(i=1; i<=m; i++)
     printf("%2d     %2d     %2d     %2d     %2d   \n",i,HT[i].weight,HT[i].parent,HT[i].lchild,HT[i].rchild);

   //-------从叶子到根逆向求每个字符的赫夫曼编码--------
   HC = (HuffmanCode)malloc((n+1)*sizeof(char *));//分配n个字符编码的头指针向量，0号单元未用
   cd = (char *)malloc(n*sizeof(char));             //分配求编码的工作空间

   cd[n-1]='\0';                                    //编码结束符
   for(i=1; i<=n; ++i)                              //逐个字符求赫夫曼编码
   {  start=n-1;                                    //编码结束符位置
      for(c=i,f=HT[i].parent; f!=0; c=f,f=HT[f].parent)//从叶子到根逆向求编码
      {		  if(HT[f].lchild==c) cd[--start]='0';
		  else cd[--start]='1';
      }
	  HC[i] = (char *)malloc((n-start)*sizeof(char));//为第I个字符编码分配空间
	  strcpy(HC[i],&cd[start]);                      //从cd复制编码（串）到HC
   }
   free(cd);                                         //释放工作空间


//--------无栈非递归遍历赫夫曼树，求赫夫曼编码---------
  /* HC = (HuffmanCode)malloc((n+1)*sizeof(char *));
   cd = (char *)malloc(n*sizeof(char));
   int p1=m;  int cdlen=0;
   for(i=1; i<=m; ++i) HT[i].weight=0;//改作遍历赫夫曼树时用作结点状态标志
   while(p1)
   {  if(HT[p1].weight==0)                    //向左
      {  HT[p1].weight=1;
		 if (HT[p1].lchild!=0) { p1=HT[p1].lchild; cd[cdlen++]='0'; }
		 else if(HT[p1].rchild==0)            //登记叶子结点的字符的编码
		 {	 HC[p1]=(char *)malloc((cdlen+1)*sizeof(char));
			 cd[cdlen]='\0';strcpy(HC[p1],cd);//复制编码（串）
         }
      }
      else if(HT[p1].weight==1)               //向右
	       {  HT[p1].weight=2;
	         if(HT[p1].rchild!=0) { p1=HT[p1].rchild; cd[cdlen++]='1'; }
	       } 
	       else
		   {                                  // HT[p].weight==2，退回
              HT[p1].weight=0; p1=HT[p1].parent; --cdlen;//退到父结点，编码长度减1
		   }
   }*/
}



int main()
{   int i;
	HuffmanTree HHT;
    HuffmanCode HHC;
	int a[8]={5,29,7,8,14,23,3,11};
    HuffmanCoding(HHT, HHC, a, 8);
	for (i=1;i<=8;i++)
    { printf("HC[%d]=%s\n",i,HHC[i]); } 
}
