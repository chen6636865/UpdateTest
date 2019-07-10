const SubgameManager = require('SubgameManager');
import Helloworld from "./Helloworld";

cc.Class({
    extends: cc.Component,

    properties: {
        downloadLabel: {
            default: null,
            type: cc.Label
        }
    },

    onLoad: function () {
        const name = 'ddz';    
        //判断子游戏有没有下载
        if (SubgameManager.isSubgameDownLoad(name)) {
            //已下载，判断是否需要更新
            SubgameManager.needUpdateSubgame(name, (success) => {
                if (success) {
                    this.downloadLabel.string = "子游戏需要更新";
                } else {
                    this.downloadLabel.string = "子游戏不需要更新";
                }
            }, () => {
                Helloworld.ShowLog('出错了');
            });
        } else {
            this.downloadLabel.string = "子游戏未下载";
        }

    },

    ClickSubGameBtn: function()
    {
         //下载子游戏/更新子游戏
         SubgameManager.downloadSubgame("ddz", (progress) => {
            if (isNaN(progress)) {
                progress = 0;
            }
            this.downloadLabel.string = "资源下载中   " + parseInt(progress * 100) + "%";
        }, function(success) {
            if (success) {
                SubgameManager.enterSubgame('ddz');
            } else {
                Helloworld.ShowLog('下载失败');
            }
        });
    },
});