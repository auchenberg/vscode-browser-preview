export default class Logger {
  private enabled: boolean = true;

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }

  public log(...messages: any[]) {
    if (!this.enabled) {
      return;
    }

    console.log(...messages);
  }
}
