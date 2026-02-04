import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PoAccordionModule, PoChartModule, PoChartOptions, PoChartSerie, PoContainerModule,
  PoDialogService,
  PoDisclaimerGroupModule,
  PoFieldModule,
  PoLoadingModule,
  PoModule,
  PoMultiselectFilterMode,
  PoMultiselectOption,
  PoTableModule,
  PoWidgetModule
} from '@po-ui/ng-components';

interface CentroCusto {
  codCusto: string;
  descCusto: string;
  orcado?: number;
  real?: number;
}

interface Departamentos {
  codDepto: string;
  descDepto: string;
  orcado?: number;
  real?: number;
}

interface Funcoes {
  codFuncao: string;
  descFuncao: string;
  orcado?: number;
  real?: number;
}

@Component({
  selector: 'rh-dashboard',
  standalone: true,
  imports: [PoTableModule, PoContainerModule, PoWidgetModule, PoChartModule, PoLoadingModule, PoModule, PoAccordionModule, CommonModule, PoDisclaimerGroupModule, PoFieldModule, FormsModule],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [PoDialogService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  delta = 0;
  orcado = 0;
  ativos = 0;
  atestados = 0;
  afastados = 0;
  ferias = 0;
  format: string = '';
  custo: string = '';
  departamento: string = '';
  funcao: string = '';
  dataIni: string | Date = '';
  tipoCol = 'column'; // Tipo de gráfico (coluna)
  tipoPizza = 'line'; // Tipo de gráfico (pizza)
  pizzaItens: Array<PoChartSerie> = []
  colunaItens: Array<PoChartSerie> = []
  custos: Array<any> = [];
  departamentos: Array<any> = [];
  funcoes: Array<any> = [];
  funcionarios: Array<any> = [];
  loading = false;
  selectCusto: PoMultiselectOption[] = [];
  selectDepartamentos: PoMultiselectOption[] = [];
  selectFuncoes: PoMultiselectOption[] = [];
  //readonly API_URL = 'http://vhwin1065:9095/rest/protheus/v1/poui';
  readonly API_URL = 'http://vhwin1065:9080/rest/protheus/v1/poui';

  filterMode = PoMultiselectFilterMode.contains;

  constructor(private http: HttpClient, private poAlert: PoDialogService) { }

  chartOptions: PoChartOptions = {
    legend: true,
  };

  ngOnInit() {
    this.carregarDados();
  }

  getHeader(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Charset': 'application/json',
      'tenantid': '02,01',
      'x-erp-module': 'EST'
    });
  }

  filtrar(): void {

    if ((this.funcao && this.funcao.length > 0) || (this.departamento && this.departamento.length > 0)) {
      if (!this.custo || (Array.isArray(this.custo) && this.custo.length === 0)) {
        this.poAlert.alert({
          title: 'Erro',
          message: 'O centro de custo é obrigatório'
        });
        return;
      }
    }

    const body = {
      dataInicial: this.dataIni || this.dataAtual(),
      centroCusto: Array.isArray(this.custo) ? this.custo : [],
      departamentos: Array.isArray(this.departamento) ? this.departamento : [],
      funcoes: Array.isArray(this.funcao) ? this.funcao : []
    };
    this.carregarDados(body);
  }

  carregarDados(body?: any): void {
    this.loading = true;
    this.http.post<any>(`${this.API_URL}/listar-tabelas`, body || '', { headers: this.getHeader() })
      .subscribe(response => {
        this.processarDados(response);
        this.loading = false;
      }, error => {
        this.loading = false;
        console.error('Erro ao carregar dados:', error);
      });
  }

  processarDados(response: any) {
    // Processa dados de centro de custo, departamento, função, etc.
    this.custos = this.processarCentroCusto(response);
    this.departamentos = this.processarDepartamentos(response);
    this.funcoes = this.processarFuncoes(response);

    // Atualiza variáveis de totais
    this.afastados = this.calcularTotalReal(response.afastadosCentroCustoReal);
    this.ativos = response.ativos;
    this.atestados = this.calcularTotalReal(response.atestados);
    this.ferias = this.calcularTotalReal(response.ferias);
    this.orcado = this.calcularTotalOrc(response.centroCustoOrc);

    // Atualiza gráficos
    this.colunaItens = [
      { label: 'Orçado', data: [this.orcado] },
      { label: 'Ativos', data: [this.ativos] }
    ];
    this.pizzaItens = [
      { label: 'Atestado', data: this.atestados, color: 'po-color-08' },
      { label: 'Afastados', data: this.afastados, color: 'po-color-07' },
      { label: 'Ativos', data: this.ativos, color: 'po-color-10' },
      { label: 'Ferias', data: this.ferias, color: 'po-color-02' }
    ];
    this.delta = this.ativos - this.orcado;

    // Atualiza opções de filtro
    this.selectCusto = response.selectCustos;
    this.selectDepartamentos = response.selectDepartamentos;
    this.selectFuncoes = response.selectFuncoes;
  }

  calcularTotalReal(items: any[]): number {
    return (items || []).reduce((soma: number, item: { real?: number }) => soma + (item.real || 0), 0);
  }
  calcularTotalOrc(items: any[]): number {
    return (items || []).reduce((soma: number, item: { orcado?: number }) => soma + (item.orcado || 0), 0);
  }

  processarCentroCusto(response: any): CentroCusto[] {
    const orcadosCC = response.centroCustoOrc || [];
    const reaisCC = response.centroCustoReal || [];
    const afastadosCC = response.afastadosCentroCustoReal || [];

    const reaisCorrigidos = reaisCC.map((r: CentroCusto) => {
      const afastado = afastadosCC.find((a: CentroCusto) => a.codCusto === r.codCusto);
      const realCorrigido = (r.real || 0) - (afastado?.real || 0);
      return { ...r, real: realCorrigido > 0 ? realCorrigido : 0 };
    });

    return orcadosCC.map((o: CentroCusto) => {
      const real = reaisCorrigidos.find((r: CentroCusto) => r.codCusto === o.codCusto);
      return { codCusto: o.codCusto, descCusto: o.descCusto, orcado: o.orcado || 0, real: real?.real || 0 };
    });
  }

  processarDepartamentos(response: any): Departamentos[] {
    const orcadosDpto = response.departamentosOrc || [];
    const reaisDpto = response.departamentosReal || [];
    const afastadosDpto = response.afastadosDeparatamentosReal || [];

    const reaisCorrigidos = reaisDpto.map((r: Departamentos) => {
      const afastado = afastadosDpto.find((a: Departamentos) => a.codDepto === r.codDepto);
      const realCorrigido = (r.real || 0) - (afastado?.real || 0);
      return { ...r, real: realCorrigido > 0 ? realCorrigido : 0 };
    });

    return orcadosDpto.map((o: Departamentos) => {
      const realDpto = reaisCorrigidos.find((r: Departamentos) => r.codDepto === o.codDepto);
      return { codDepto: o.codDepto, descDepto: o.descDepto, orcado: o.orcado, real: realDpto ? realDpto.real : 0 };
    });
  }

  processarFuncoes(response: any): Funcoes[] {
    const orcadosFuncoes = response.funcoesOrc || [];
    const reaisFuncoes = response.funcoesReal || [];
    const afastadosFuncoes = response.afastadosFuncoesReal || [];

    const reaisCorrigidos = reaisFuncoes.map((r: Funcoes) => {
      const afastado = afastadosFuncoes.find((a: Funcoes) => a.codFuncao === r.codFuncao);
      const realCorrigido = (r.real || 0) - (afastado?.real || 0);
      return { ...r, real: realCorrigido > 0 ? realCorrigido : 0 };
    });

    return orcadosFuncoes.map((o: Funcoes) => {
      const realFuncoes = reaisCorrigidos.find((r: Funcoes) => r.codFuncao === o.codFuncao);
      return { codFuncao: o.codFuncao, descFuncao: o.descFuncao, orcado: o.orcado, real: realFuncoes ? realFuncoes.real : 0 };
    });
  }

  dataAtual(): string {
    const today = new Date();
    return `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
  }

  getDeltaTitle() {
    return this.delta > 0 ? `🔼 Delta: ${this.delta}` : `🔽 Delta: ${this.delta}`;
  }
}
