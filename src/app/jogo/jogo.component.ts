import { Component, OnInit, ViewChild } from '@angular/core';
import { CONTROLS, CORES, BOARD_SIZE, GAME_MODES, PAISES, PAISES_CORD } from './jogo.constantes';

@Component({
  selector: 'app-jogo',
  templateUrl: './jogo.component.html',
  styleUrls: ['./jogo.component.css'],
  host: { '(document:keydown)': 'controleDeEventos($event)' }
  
})
export class JogoComponent implements OnInit {
  
  private velocidade: number;
  private tempDirection: number;
  private default_mode = 'classic';
  private isGameOver = false;

  public all_modes = GAME_MODES;
  public all_paises = PAISES;
  public pais_cord = PAISES_CORD;
  public getKeys = Object.keys;
  public board = [];
  public obstacles = [];
  public score = 0;
  public seMostraMenu = false; 
  public seMostraPaises =false;
  public jogando = false;

  private snake = {
    direction: CONTROLS.LEFT,
    parts: [
      {
        x: -1,
        y: -1
      }
    ]
  };

  private fruit = {
    x: -1,
    y: -1
  };
  
  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;
  latitude: any;
  longitude: any;

  constructor() {this.criaTabuleiro();  }

  
  ngAfterContentInit() {
    let mapProp = {
      center: new google.maps.LatLng(0, 0),
      zoom: 1,
      mapTypeId: google.maps.MapTypeId.HYBRID
    };
    this.map = new google.maps.Map(document.getElementById("map"), mapProp);

  }
  

  trocaPais(pais : string): void  {
let paisCordLocal:any;
    console.log(pais);
if(pais == 'brasil'){
paisCordLocal = this.pais_cord.brasil;
}else if(pais == 'italia'){
  paisCordLocal = this.pais_cord.italia;
}else if(pais == 'alemanha'){
  paisCordLocal = this.pais_cord.alemanha
}

    this.seMostraMenu = !this.seMostraMenu;
    this.seMostraPaises = !this.seMostraPaises;

    let mapProp = {
      center: new google.maps.LatLng(paisCordLocal.x , paisCordLocal.y),
      zoom: paisCordLocal.zoom,
      mapTypeId: google.maps.MapTypeId.HYBRID
    };
    this.map = new google.maps.Map(document.getElementById("map"), mapProp);

  }


  controleDeEventos(e: KeyboardEvent) {
    if (e.keyCode === CONTROLS.LEFT && this.snake.direction !== CONTROLS.RIGHT) {
      this.tempDirection = CONTROLS.LEFT;
    } else if (e.keyCode === CONTROLS.UP && this.snake.direction !== CONTROLS.DOWN) {
      this.tempDirection = CONTROLS.UP;
    } else if (e.keyCode === CONTROLS.RIGHT && this.snake.direction !== CONTROLS.LEFT) {
      this.tempDirection = CONTROLS.RIGHT;
    } else if (e.keyCode === CONTROLS.DOWN && this.snake.direction !== CONTROLS.UP) {
      this.tempDirection = CONTROLS.DOWN;
    }
  }
  defineCores(col: number, row: number): string {
    if (this.isGameOver) {
      return CORES.GAME_OVER;
    } else if (this.fruit.x === row && this.fruit.y === col) {
      return CORES.FRUTA;
    } else if (this.snake.parts[0].x === row && this.snake.parts[0].y === col) {
      return CORES.CABECA;
    } else if (this.board[col][row] === true) {
      return CORES.BODY;
    } else if (this.default_mode === 'obstaculos' && this.verificaObstaculos(row, col)) {
      return CORES.OBSTACULO;
    }
    return CORES.BOARD;
  };

  defineOpacity(col: number, row: number): string{

    if (this.isGameOver) {
      return '1';
    } else if (this.fruit.x === row && this.fruit.y === col) {
      return '1';
    } else if (this.snake.parts[0].x === row && this.snake.parts[0].y === col) {
      return '1';
    } else if (this.board[col][row] === true) {
      return '1';
    } else if (this.default_mode === 'obstaculos' && this.verificaObstaculos(row, col)) {
      return '1';
    }
    return '0';
  };
  

  novoJogo(modulo: string): void {
    this.default_mode = modulo || 'classic';
    this.seMostraMenu = false;
    this.seMostraPaises = false;
    this.jogando = true;
    this.score = 0;
    this.tempDirection = CONTROLS.LEFT;
    this.isGameOver = false;
    this.velocidade = 150;
    this.snake = {
      direction: CONTROLS.LEFT,
      parts: []
    };

    for (let i = 0; i < 3; i++) {
      this.snake.parts.push({ x: 8 + i, y: 8 });
    }

    if (modulo === 'obstaculos') {
      this.obstacles = [];
      let j = 1;
      do {
        this.adicionaObstaculos();
      } while (j++ < 9);
    }

    this.novaFruta();
    this.atualizaPosicao();
  }


  atualizaPosicao(): void {
    //avança a cabeça
    let newHead = this.mudaPosicaoCabeca();
    let me = this;

    //Colisao Lateral no modo classico
    if (this.default_mode === 'classic' && this.colisaoLateral(newHead)) {
      return this.gameOver();
    }
    //Jogo minhoca para o outro lado no modo Sem parede
    else if (this.default_mode === 'semParede') {
      this.jogaDoOutroLadoModoSemParede(newHead);
    }
    //Verifica se bateu em obstaculos ou joga do outro lado.
    else if (this.default_mode === 'obstaculos') {
      this.jogaDoOutroLadoModoSemParede(newHead);
      if (this.bateuNoObstaculo(newHead)) {
        return this.gameOver();
      }
    }
    //Verfica se se bateu
    if (this.seBateu(newHead)) {
      return this.gameOver();
    } 
    //verifica se pegoufruta e come
    else if 
    (this.pegaFruta(newHead)) {
      this.comeFruta();
    }

    let oldTail = this.snake.parts.pop();
    this.board[oldTail.y][oldTail.x] = false;

    this.snake.parts.unshift(newHead);
    this.board[newHead.y][newHead.x] = true;

    this.snake.direction = this.tempDirection;

    setTimeout(() => {
      me.atualizaPosicao();
    }, this.velocidade);
  }

  novaFruta(): void {
    let x = this.randomNumber();
    let y = this.randomNumber();

    if (this.board[y][x] === true || this.verificaObstaculos(x, y)) {
      return this.novaFruta();
    }

    this.fruit = {
      x: x,
      y: y
    };
  }


  comeFruta(): void {
    this.score++;

    let tail = Object.assign({}, this.snake.parts[this.snake.parts.length - 1]);

    this.snake.parts.push(tail);
    this.novaFruta();

    if (this.score % 5 === 0) {
      this.velocidade -= 20;
    }
  }

  pegaFruta(part: any): boolean {
    return (part.x === this.fruit.x && part.y === this.fruit.y);
  }
  seBateu(part: any): boolean {
    return this.board[part.y][part.x] === true;
  }
  bateuNoObstaculo(part: any): boolean {
    return this.verificaObstaculos(part.x, part.y);
  }
  colisaoLateral(part: any): boolean {
    return (part.x === BOARD_SIZE || part.x === -1 || part.y === BOARD_SIZE || part.y === -1);
  }
  verificaObstaculos(x, y): boolean {
    let res = false;

    this.obstacles.forEach((val) => {
      if (val.x === x && val.y === y) {
        res = true;
      }
    });

    return res;
  }


  mudaPosicaoCabeca(): any {
    let newHead = Object.assign({}, this.snake.parts[0]);

    if (this.tempDirection === CONTROLS.LEFT) {
      newHead.x -= 1;
    } else if (this.tempDirection === CONTROLS.RIGHT) {
      newHead.x += 1;
    } else if (this.tempDirection === CONTROLS.UP) {
      newHead.y -= 1;
    } else if (this.tempDirection === CONTROLS.DOWN) {
      newHead.y += 1;
    }

    return newHead;
  }



  gameOver(): void {
    this.isGameOver = true;
    let me = this;
    this.jogando =  false
    setTimeout(() => {
      me.isGameOver = false;
    }, 2000);

    this.tamanhoDoJogo();
  }

  tamanhoDoJogo(): void {
    this.board = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      this.board[i] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        this.board[i][j] = false;
      }
    }
  }

  jogaDoOutroLadoModoSemParede(part: any): void {
    if (part.x === BOARD_SIZE) {
      part.x = 0;
    } else if (part.x === -1) {
      part.x = BOARD_SIZE - 1;
    }

    if (part.y === BOARD_SIZE) {
      part.y = 0;
    } else if (part.y === -1) {
      part.y = BOARD_SIZE - 1;
    }
  }

  adicionaObstaculos(): void {
    let x = this.randomNumber();
    let y = this.randomNumber();

    if (this.board[y][x] === true || y === 8) {
      return this.adicionaObstaculos();
    }

    this.obstacles.push({
      x: x,
      y: y
    });
  }

  criaTabuleiro(): void {
    this.board = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
      this.board[i] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        this.board[i][j] = false;
      }
    }
  }

  mostraMenu(): void {
  this.seMostraPaises = !this.seMostraPaises;
 
  }

  randomNumber(): any {
    return Math.floor(Math.random() * BOARD_SIZE);
  }
  ngOnInit() {
  }

}
