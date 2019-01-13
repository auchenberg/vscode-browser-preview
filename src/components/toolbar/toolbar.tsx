
import * as React from 'react';
import './toolbar.css';

import UrlInput from '../url-input/url-input';

import iconBackward from '../toolbar/icons/_ionicons_svg_md-arrow-back.svg';
const iconBackwardStyle = {
    backgroundImage: `url(${iconBackward})`
}

import iconForward from '../toolbar/icons/_ionicons_svg_md-arrow-forward.svg';
const iconForwardStyle = {
    backgroundImage: `url(${iconForward})`
}

import iconRefresh from '../toolbar/icons/_ionicons_svg_md-refresh.svg';
const iconRefreshStyle = {
    backgroundImage: `url(${iconRefresh})`
}

interface IToolbarProps {
    canGoBack: boolean,
    canGoForward: boolean,
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
                    <button className="backward" style={iconBackwardStyle} onClick={this.handleBack} disabled={this.props.canGoBack}>Backward</button>
                    <button className="forward" style={iconForwardStyle} onClick={this.handleForward} disabled={this.props.canGoForward}>Forward</button>
                    <button className="refresh" style={iconRefreshStyle} onClick={this.handleRefresh}>Refresh</button>
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



