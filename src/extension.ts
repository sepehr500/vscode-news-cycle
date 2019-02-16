// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as TmpParse from "rss-parser";
const Parser: any = TmpParse;

let statusBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  999
);

export function activate({ subscriptions }: vscode.ExtensionContext) {
  const showNewsCommandId = "showNews";

  statusBar.command = showNewsCommandId;

  subscriptions.push(statusBar);
  startNewsLoop();

  subscriptions.push(
    vscode.commands.registerCommand(showNewsCommandId, async () => {
      vscode.env.openExternal(vscode.Uri.parse(currentHeadline));
    })
  );
}

const getConfig = () => vscode.workspace.getConfiguration("newsCycle");

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type HeadlineType = {
  url: string;
  headline: string;
  summary?: string;
};

const buildRedditString = () =>
  `https://www.reddit.com/r/${getConfig().subreddit}/.rss`;

const newsSources = {
  HackerNews: () => "https://hnrss.org/frontpage",
  CNN: () => "http://rss.cnn.com/rss/cnn_topstories.rss",
  Reddit: buildRedditString
};

const fetchNews = async () => {
  const parser = new Parser();
  const feed = await parser.parseURL(newsSources[getConfig().newsSource]());
  return feed.items.map((item: any) => ({
    url: item.link,
    headline: item.title
  }));
};

let currentHeadline: string;

const startNewsLoop = async () => {
  console.log("News alert has started.");
  while (true) {
    try {
      const headlines: HeadlineType[] = await fetchNews();
      const HEADLINE_COUNT = getConfig().headlineCount;
      for (const headline of headlines.slice(0, HEADLINE_COUNT)) {
        const MAX_HEADLINE_LENGTH = getConfig().headlineLength;
        const SCROLL_SPEED = getConfig().scrollSpeed * 1000;
        statusBar.show();
        currentHeadline = headline.url;
        statusBar.tooltip = headline.headline;
        statusBar.text = `$(megaphone) ${headline.headline.substring(
          0,
          MAX_HEADLINE_LENGTH
        )}${headline.headline.length > MAX_HEADLINE_LENGTH ? "..." : ""}`;
        await sleep(SCROLL_SPEED);
      }
    } catch (error) {
      const SCROLL_SPEED = getConfig().scrollSpeed * 1000;
      console.log(error);
      statusBar.show();
      statusBar.text = "Failed to fetch news. Retrying...";
      await sleep(SCROLL_SPEED);
    }
  }
};

// const scrollHeadline = async (headline: string) => {
//   statusBar.show();
//   statusBar.tooltip = headline;
//   const strLength = 30;
//   statusBar.text = "$(megaphone) " + headline.substring(0, strLength) + "...";
//   await sleep(5000);
//   for (let x = 0; x < headline.length; x++) {
//     statusBar.text =
//       "$(megaphone) " +
//       headline
//         .substr(x)
//         .substring(0, strLength)
//         .padEnd(strLength, " ");
//     await sleep(200);
//   }
//   statusBar.text = "$(megaphone) " + headline.substring(0, strLength) + "...";
// };

// this method is called when your extension is deactivated
export function deactivate() {}
