---
title: "Quant Notes_COnfusions(CourseNotes for Study & Research Only)"
subtitle: "Some Confusions"
date: 2025-10-15 12:02:00 +0800
categories: [Notes,Quant]  
tags: [Quant,Notes]
---

### 為什麼 Position 的經常變化會不太好？ (高換手率問題)

這個問題的核心是交易成本和信號質量。頻繁地改變倉位，在量化領域被稱為高換手率 (High Turnover)。高換手率會帶來幾個致命問題：

交易成本 (Transaction Costs): 這是最直接的。每一次買入或賣出都不是免費的，你需要支付手續費、稅金等。如果你的策略每天都在頻繁交易，這些成本會像白蟻一樣，不斷侵蝕你的利潤，哪怕策略本身是盈利的。

**市場衝擊/滑價** (Market Impact/Slippage): 當你進行大額交易時，你的買單會推高價格，賣單會壓低價格。你實際成交的價格，往往會比你下單時看到的價格要差一些。交易越頻繁，這種“滑價”造成的損失就越大。

信號不穩定: 一個每天都在“買入”和“賣出”之間反覆橫跳的信號，很可能只是捕捉到了市場的隨機**“噪音” (Noise)，而不是一個穩定、可持續的“信號” (Signal)**。我們希望交易的是那些能夠持續一段時間的、可信的規律，而不是曇花一現的市場波動。

總結：**一個好的Alpha因子，其產生的倉位信號應該是相對穩定的。**

### 為什麼要使用 decay？
現在我們知道了“倉位頻繁變化是不好的”，那麼如何解決這個問題呢？decay 就是解決方案之一。

decay（衰減）在WorldQuant BRAIN這類平台中，通常指時間序列上的平滑處理，最常見的實現是指數加權移動平均 (Exponential Moving Average, EMA)。你可以把它想像成一個“濾波器”。

它的作用: decay會計算一個信號在過去一段時間（比如10天）的加權平均值，其中越近的數據權重越高，越遠的數據權重越低但仍有影響。

它的目的: 通過這種加權平均，它可以濾掉信號中那些短期的、無意義的“噪音”，讓信號的長期趨勢更加突顯。


### 现在我找了另外的data field，那么现在rank 的到底是什么呢？而且为什么一个简单的rank（）也算作一个Alpha，它不过是把是股票排序，后面的数据是怎么算出来的（具体的机理是怎样的）？然后为什么我尝试新的data field以后结果这么差?

![](/assets/img/Course/newFieldCode.png)

![](/assets/img/Course/settings.png)

![](/assets/img/Course/newFieldResult.png)


1. "现在rank 的到底是什么呢？" (What exactly is being ranked now?)

You used the data field sci12_sentiment. This is likely a numerical score representing the news and social media sentiment for each stock. So, the expression rank(sci12_sentiment) does the following every single day of the simulation:

It looks at all the stocks in your universe (e.g., TOP1000).

It gets the sci12_sentiment score for each of those 1000 stocks on that specific day.

It then ranks those 1000 sentiment scores from lowest to highest.

Example for a single day:

Ticker	sci12_sentiment (Raw Score)	rank(sci12_sentiment) (Alpha Signal)
AAPL	0.85 (Very Positive)	0.95 (e.g., Top 5%)
MSFT	0.60 (Positive)	0.80 (e.g., Top 20%)
XOM	-0.10 (Slightly Negative)	0.40 (e.g., Bottom 40%)
T	-0.90 (Very Negative)	0.05 (e.g., Bottom 5%)
So, you are ranking the relative sentiment of stocks against their peers on a daily basis.

2. "为什么一个简单的rank()也算作一个Alpha，它不过是把股票排序，后面的数据是怎么算出来的？" (Why is a simple rank() an Alpha, and how are the metrics calculated?)

This is the magic of the backtesting engine. A simple rank() expression is considered an Alpha because it represents a complete, testable trading hypothesis.

Your hypothesis is: "I believe that stocks with higher sentiment today will have better returns tomorrow compared to stocks with lower sentiment."

Here is the mechanism the platform uses to test this hypothesis and calculate the results:

Signal to Position: The platform's simulator takes your Alpha's output (the daily ranks from 0 to 1) and converts it into a target portfolio. It aims to be market-neutral.

High Rank (e.g., > 0.9): Take a Long position (Buy).

Low Rank (e.g., < 0.1): Take a Short position (Sell).

Middle Rank: Take no position (Flat).

Daily Simulation (Backtest):

On Day 1: It calculates the ranks and "pretends" to buy the high-sentiment stocks and short the low-sentiment stocks.

On Day 2: It looks at the real-world returns of the stocks from Day 1. It calculates how much money the portfolio made or lost (this is the daily PnL - Profit and Loss).

Rebalancing: Also on Day 2, it recalculates the sentiment ranks for all stocks. The target portfolio might change. For example, AAPL's rank might drop, so the simulator "sells" some AAPL. This creates Turnover.

Repeat: This process repeats for every single day in the test period (e.g., from 2018 to 2023).

From Daily PnL to Final Metrics:
After the simulation finishes, the platform has a long list of daily PnL values. It uses this list to calculate all the statistics you see in the first screenshot:

Returns: The cumulative sum of the daily PnL.

Sharpe Ratio: The risk-adjusted return, calculated from the mean and standard deviation of the daily PnL.

Drawdown: The largest peak-to-trough drop in the cumulative PnL curve.

Turnover: How much buying and selling was required each day to maintain the target portfolio.

So, an "Alpha" isn't just a ranking; it's the entire strategy implied by that ranking, which the platform automatically simulates for you.

3. "为什么我尝试新的data field以后结果这么差？" (Why are my results so bad?)

Welcome to the real world of quantitative research! This is the most common experience for a researcher. Over 99% of initial ideas fail. Here are the most likely reasons your results are poor:

The Hypothesis is Wrong: The most simple reason. It's possible that high news sentiment has no actual predictive power over the next day's stock returns. The market may have already priced in that sentiment.

Timing is Off (Lead/Lag Effects): The signal might be too early or too late. Maybe sentiment today predicts returns in two days, not one. To test this, you'd need to use a delay() operator, like rank(delay(sci12_sentiment, 2)).

The Signal is Too Noisy: Raw data fields like sentiment can be very volatile and "noisy." A signal that jumps around every day leads to high Turnover (as seen in your screenshot, 66% is quite high), and transaction costs eat all the potential profits. The standard solution is to smooth the signal using an operator like decay_linear(), which we discussed.

The Signal Needs Neutralization: The sentiment signal might have a built-in bias. For example, maybe tech stocks always have higher sentiment scores than utility stocks. If tech stocks performed poorly in a given year, your alpha would also perform poorly. You might need to neutralize the signal against sectors or industries to remove these biases.

### `rank(ts_decay_linear(-scl12_sentiment,5))` quite weird，poor performance In train set, but good in test set

![](/assets/img/Course/WeirdTrain.png)

![](/assets/img/Course/WeirdTest.png)

#### The Core Reason: A Change in Market Regime 🏄
Think of your alpha strategy as a specific type of surfboard. Your reversal strategy is like a specialized shortboard designed for fast, steep waves.

The Train Set (2018-2022): Let's imagine the market during this period was like an ocean with small, choppy, or long, rolling waves. In this environment, your specialized shortboard (your reversal alpha) doesn't work well. This might have been a "momentum-driven" market where buying winners and selling losers was the dominant trend. Your reversal strategy would have consistently lost money, which is reflected in your poor training set results (Sharpe 0.46).

The Test Set (e.g., 2023): Suddenly, the market conditions changed. The ocean started producing the perfect, steep waves your shortboard was designed for. This might have been a volatile, news-driven, or range-bound market where sentiment overreacted, and betting against the crowd (reversal) was highly profitable. Your alpha suddenly performed brilliantly (Sharpe 1.73).

Looking at your data, the entire positive performance of your alpha comes almost exclusively from the year 2023 (Sharpe = 4.04), which was likely your test period. This is a massive clue.

#### Why This is a Red Flag 🚩 (The Danger of False Confidence)
While a high Sharpe ratio in the test set looks exciting, this situation is actually a major red flag.

It's Not Robust: A good alpha strategy should be like an all-purpose longboard—it might not be the best on any single type of wave, but it performs reasonably well in most conditions. Your strategy is a "one-trick pony." It only works in a very specific type of market that might not appear again for years.

It's Likely Luck: Your success in the test set is probably not because you found a genuinely brilliant, persistent signal. It's more likely that you got lucky—your test period just happened to be the perfect storm for your specific idea.

Unreliable for the Future: You cannot trust this alpha to make money in the future. If the market regime shifts back to the 2018-2022 style, your strategy will start losing money again, just as it did in the training set.

In quantitative finance, **consistency across different time periods and market conditions is far more important than a spectacular result in a single, short period**. Your training set, in this case, is actually giving you a more honest (and worrying) picture of the strategy's typical performance.

### But how could i control the turnover, making it lower? Choosing another dataset or operator?

![](/assets/img/Course/HighTurnover.png)

#### 1. Smooth Your Signal with decay Operators (The Best Method) smoothing
This is the most common and powerful technique. Think of decay operators like ts_decay_linear as a filter that smooths out the daily "noise" from your signal, revealing the underlying trend. It calculates a weighted average of your signal over a recent period (e.g., the last 10 days), which makes the final output change much more gradually.

By making the signal smoother, the target positions don't jump around as much, which directly leads to lower turnover.

How to Apply It:
Wrap your entire existing expression in a decay operator. A window of 5 to 20 days is a good starting point.

Try this expression:

ts_decay_linear( ((-ts_rank(returns, 252)) * (vwap / close)), 10)
ts_decay_linear(..., 10) tells the system to calculate a 10-day smoothed, weighted average of the signal inside the parentheses. This will dramatically reduce the day-to-day fluctuations and lower your turnover.

#### 2. Use Slower-Moving Data Fields 🐢
The root cause of your high turnover is the use of returns, which measures a 1-day change. A more stable approach is to base your alpha on data that doesn't change as quickly.

Instead of returns, consider using:

Longer-Term Momentum: Calculate returns over a longer period. The expression for a 20-day return is (close - delay(close, 20)) / delay(close, 20). This value is inherently more stable than a 1-day return.

Fundamental Data: This is what the tutorial hinted at with the fn_liab_fair_val_1_a example. Fundamental data (like revenue, debt, assets) is reported quarterly or annually, making it a very low-turnover signal by nature.