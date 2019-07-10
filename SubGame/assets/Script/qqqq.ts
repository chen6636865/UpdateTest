
const {ccclass, property} = cc._decorator;

@ccclass
export default class qqqq extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    onLoad () 
    {
        console.log("qqqq加载！");
    }

    start () {
        console.log("qqqq  start");
    }

    public OnClickToHall():void
    {
        if(jsb.fileUtils.isFileExist(jsb.fileUtils.getWritablePath() + 'ALLGame/' + "ddz/src/dating.js"))
        {
            ShowLogJava("大厅的dating.js存在  ");
            window.require(jsb.fileUtils.getWritablePath() + "ALLGame/ddz/src/dating.js");            
        }
        else
        {
            ShowLogJava("大厅的dating.js不存在  ");
        }

        // cc.director.loadScene("Helloworld", function(){
        //     ShowLogJava("返回helloWorld");
        // });
    }

    // update (dt) {}
}

var ShowLogJava = function(msg: string): void
{
    cc.log(msg);
    if(cc.sys.os == cc.sys.OS_ANDROID)
    {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "ShowLog", "(Ljava/lang/String;)V", msg);
    }   
};

