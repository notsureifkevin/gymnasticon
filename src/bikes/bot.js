import {once, EventEmitter} from 'events';
import {Timer} from '../util/timer';

/**
 * Pretends to be a real bike riding at a given fixed cadence and power.
 * The cadence and power can be changed on-the-fly over a UDP socket.
 * Useful for testing without having to use a real bike.
 */
export class BotBikeClient extends EventEmitter {
  /**
   * Create a BotBikeClient instance.
   * @param {number} power - initial power (watts)
   * @param {number} cadence - initial cadence (rpm)
   * @param {string} host - host to listen on for udp control interface
   * @param {number} port - port to listen on for udp control interface
   */
  constructor(power, cadence, host, port) {
    super();

    this.onStatsUpdate = this.onStatsUpdate.bind(this);
    this.getStatsUpdate = this.getStatsUpdate.bind(this);

    this.power = power;
    this.cadence = cadence;
    this._host = host;
    this._port = port;

    this._address = '00:00:00:00:00:00';

    this._timer = new Timer(0.2);
    this._timer.on('timeout', this.getStatsUpdate);
  }

  async connect() {
    this._timer.reset();
  }

  get address() {
    return this._address;
  }

  /**
   * @private
   */
  onStatsUpdate() {
    const {power, cadence} = this;
    this.emit('stats', {power, cadence});
  }

  getStatsUpdate() {
    var http = require('http');

    let url = "http://"+ this._host +":"+ this._port +"/metrics";
    let options = {json: true};
      
    http.get(url,(res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          let json = JSON.parse(body);

          this.power = json.power;
          this.cadence = json.cadence;
          // do something with JSON
          this.onStatsUpdate()

        } catch (error) {
          console.error(error.message);
        };
      });

    }).on("error", (error) => {
      console.error(error.message);
    });
  }
}
