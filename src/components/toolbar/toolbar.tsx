
import * as React from 'react';
import './toolbar.css';

import UrlInput from '../url-input/url-input';

interface IToolbarProps {
    url: string,
    onActionInvoked: (action: string, data: object) => void
}

class Toolbar extends React.Component<IToolbarProps> {

    constructor(props: any){
        super(props)
    
        this.handleBack = this.handleBack.bind(this);
        this.handleForward = this.handleForward.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);  
        this.handleUrlChange = this.handleUrlChange.bind(this);   
    }
    
    public render() {
        return (
            <div className="toolbar">
                <div className="inner">
                    <button className="backward" onClick={this.handleBack}>Backward</button>
                    <button className="forward" onClick={this.handleForward}>Forward</button>
                    <button className="refresh" onClick={this.handleRefresh}>Refresh</button>
                    <UrlInput url={this.props.url} onUrlChanged={this.handleUrlChange} />
                </div>
            </div>
        );
    }

    private handleUrlChange(url: string) {
        this.props.onActionInvoked('urlChange', {url})
    }

    private handleBack() {
        this.props.onActionInvoked('backward', {})
    }

    private handleForward() {
        this.props.onActionInvoked('forward', {})
    }

    private handleRefresh() {
        this.props.onActionInvoked('refresh', {})
    }
}

export default Toolbar;



