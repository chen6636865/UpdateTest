const {ccclass, property} = cc._decorator;

@ccclass
export default class Helloworld extends cc.Component 
{

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    @property(cc.ProgressBar)
    fileProgress: cc.ProgressBar = null;

    
    @property(cc.ProgressBar)
    byteProgress: cc.ProgressBar = null;


    public _updating: boolean = false;
    public _canRetry:boolean =  false;
    public _storagePath:string =  '';
    public _am = null;
    public _checkListener = null;
    public versionCompareHandle = null;

    @property(cc.RawAsset)
    manifestUrl: cc.RawAsset = null;


    public static ShowLog(msg: string): void
    {
        cc.log(msg);
        if(cc.sys.os == cc.sys.OS_ANDROID)
        {
            jsb.reflection.callStaticMethod("org/cocos2dx/javascript/AppActivity", "ShowLog", "(Ljava/lang/String;)V", msg);
        }   
    }

    start () 
    {
        // init logic
        //this.label.string = this.text;
    }


    onLoad() 
    {
        // Hot update is only available in Native build
        if (!cc.sys.isNative) {
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'xiaoming-remote-asset');
        Helloworld.ShowLog('Storage path for remote asset : ' + this._storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        this.versionCompareHandle = function (versionA, versionB) {
            Helloworld.ShowLog("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                }
                else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this._am = new jsb.AssetsManager('', this._storagePath, this.versionCompareHandle);
        // if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
        //     this._am.retain();
        // }
        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        var self = this;
        this._am.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            var compressed = asset.compressed;
            // Retrieve the correct md5 value.
            var expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            var relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            var size = asset.size;
            if (compressed) {
                Helloworld.ShowLog("Verification passed : " + relativePath);
                self.label.string = self.label.string += "compressed : true";
                return true;
            }
            else {
                Helloworld.ShowLog("Verification passed : " + relativePath + ' (' + expectedMD5 + ')');
                self.label.string = self.label.string += "compressed : true";
                return true;
            }
        });
        Helloworld.ShowLog("Hot update is ready, please check or directly update.");

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this._am.setMaxConcurrentTask(2);
            Helloworld.ShowLog("Max concurrent tasks count have been limited to 2");
        }
        
        this.fileProgress.progress = 0;
        this.byteProgress.progress = 0;
    }


    public checkCb(event): void 
    {
        Helloworld.ShowLog('Code: ' + event.getEventCode());
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                Helloworld.ShowLog("No local manifest file found, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                Helloworld.ShowLog("Fail to download manifest file, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                Helloworld.ShowLog("Already up to date with the latest remote version.");
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                Helloworld.ShowLog('New version found, please try to update.');
                this.label.string = this.label.string += " || 检查到有新版本，请进行更新！";
                //this.hotUpdate();
                break;
            default:
                return;
        }

        cc.eventManager.removeListener(this._checkListener);
        this._checkListener = null;
        this._updating = false;
    }


    @property(cc.Label)
    manifestStr: cc.Label = null;

    public checkUpdate () {
        Helloworld.ShowLog("start checking...");
        if (this._updating) {
            Helloworld.ShowLog('Checking or updating ...');
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            this._am.loadLocalManifest(this.manifestUrl);
            this.manifestStr.string = "loadLocalManifest";
            Helloworld.ShowLog("loadLocalManifest");
        }
        if (!this._am.getLocalManifest() || !this._am.getLocalManifest().isLoaded()) {
            Helloworld.ShowLog('Failed to load local manifest ...');
            this.label.string = "Failed to load local manifest ...";
            return;
        }
        this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);
        
        this._am.checkUpdate();

        this.label.string = "可以进行热更新下载！";

        this._updating = true;
    }

    public _failCount = 0;

    public hotUpdate() {
        if (this._am) {
            this.label.string = "this.a_m 存在！";
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            cc.eventManager.addListener(this._updateListener, 1);

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                this._am.loadLocalManifest(this.manifestUrl);
                this.manifestStr.string = "loadLocalManifest - hotUpdate";
                Helloworld.ShowLog("this._am.getState() === jsb.AssetsManager.State.UNINITED");
            }

            this._failCount = 0;
            this._am.update();
            this._updating = true;
        
        }
    }

    public _updateListener = null;

    public updateCb (event) {
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                Helloworld.ShowLog('No local manifest file found, hot update skipped...');
                this.label.string = 'No local manifest file found, hot update skipped...';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                Helloworld.ShowLog(event.getPercent());
                Helloworld.ShowLog(event.getPercentByFile());
                Helloworld.ShowLog(event.getDownloadedFiles() + ' / ' + event.getTotalFiles());
                Helloworld.ShowLog(event.getDownloadedBytes() + ' / ' + event.getTotalBytes());

                var msg = event.getMessage();
                if (msg) {
                    Helloworld.ShowLog('Updated file: ' + msg);
                    this.label.string = 'Updated file: ' + msg;
                }
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                Helloworld.ShowLog('Fail to download manifest file, hot update skipped.');
                this.manifestStr.string = "Fail to download manifest file";
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                Helloworld.ShowLog('Already up to date with the latest remote version.');
                this.label.string = 'Already up to date with the latest remote version.';
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                Helloworld.ShowLog('Update finished. ' + event.getMessage());
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                Helloworld.ShowLog('Update failed. ' + event.getMessage());
                this._updating = false;
                this._canRetry = true;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                Helloworld.ShowLog('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                Helloworld.ShowLog(event.getMessage());
                break;
            default:
                break;
        }

        if (failed) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            this._updating = false;
        }

        if (needRestart) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
            // Prepend the manifest's search path
            var searchPaths = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();

            Helloworld.ShowLog(JSON.stringify(newPaths));
            
            Array.prototype.unshift(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    }

    onDestroy() {
        if (this._updateListener) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
        }
        // if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
        //     this._am.release();
        // }
    }


}
