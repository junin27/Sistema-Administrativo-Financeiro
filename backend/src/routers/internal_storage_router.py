"""
Router para operações de armazenamento interno (dados de teste).

Fornece endpoints para:
- Inserir dados fictícios em massa nas 5 tabelas principais
- Resetar (limpar) completamente essas tabelas
"""

import random
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..models.ddl_models import Pessoas, MovimentoContas
from ..models.parcelas_models import ParcelasContas
from ..models.classificacao_models import Classificacao, movimento_contas_has_classificacao


router = APIRouter(prefix="/internal-storage", tags=["Armazenamento Interno"])

# Dados fictícios para geração realista
NOMES_EMPRESAS = [
    "Tech Solutions", "Comércio Silva", "Distribuidora Norte", "Posto Estrela",
    "Papelaria Central", "Serviços de Limpeza", "Consultoria Oliveira", "Pedro Dev",
    "Supermercado Bom Preço", "Farmácia Saúde", "Padaria Doce Vida", "Restaurante Sabor",
    "Hotel Conforto", "Transportadora Rápida", "Construtora Forte", "Escritório Legal",
    "Clínica Médica", "Academia Fitness", "Loja de Roupas", "Eletrônicos Modernos",
    "Casa e Decoração", "Pet Shop Amigo", "Auto Peças", "Materiais de Construção",
    "Agropecuária Verde", "Pesqueiro do Lago", "Sorveteria Gelada", "Cafeteria Aroma"
]

NOMES_PESSOAS = [
    "João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa", "Carlos Souza",
    "Juliana Lima", "Roberto Alves", "Fernanda Rocha", "Lucas Pereira", "Beatriz Ferreira",
    "Rafael Martins", "Camila Rodrigues", "Bruno Carvalho", "Larissa Gomes", "Thiago Ribeiro",
    "Mariana Dias", "Gabriel Nunes", "Isabela Moreira", "Felipe Castro", "Amanda Teixeira"
]

DESCRICOES_CLASSIFICACAO_RECEITA = [
    "Venda de Produtos", "Prestação de Serviços", "Rendimentos de Aplicação",
    "Comissões Recebidas", "Aluguel Recebido", "Receita de Licenciamento",
    "Venda de Mercadorias", "Serviços Prestados", "Receita de Consultoria",
    "Receita de Publicidade", "Venda de Imóveis", "Receita de Eventos"
]

DESCRICOES_CLASSIFICACAO_DESPESA = [
    "Material de Escritório", "Aluguel", "Energia Elétrica", "Combustível",
    "Manutenção de Veículos", "Salários", "Impostos", "Telefone e Internet",
    "Material de Limpeza", "Marketing e Publicidade", "Seguros", "Honorários",
    "Material de Expediente", "Água e Esgoto", "Manutenção Predial", "Viagens"
]

DESCRICOES_MOVIMENTOS = [
    "Compra de materiais para escritório", "Prestação de serviços de consultoria",
    "Venda de produtos diversos", "Pagamento de fornecedores", "Recebimento de clientes",
    "Compra de equipamentos", "Serviços de manutenção", "Venda de mercadorias",
    "Pagamento de salários", "Receita de serviços prestados", "Compra de insumos",
    "Venda de produtos acabados", "Pagamento de impostos", "Recebimento de aluguéis",
    "Compra de matéria-prima", "Venda de produtos finais", "Serviços terceirizados",
    "Receita de comissões", "Despesas operacionais", "Receita de vendas"
]


def gerar_cnpj_ficticio(index: int) -> str:
    """Gera um CNPJ fictício formatado."""
    base = f"{12 + (index % 88):02d}.{234 + (index % 766):03d}.{567 + (index % 433):03d}"
    digito = f"{index % 10:02d}"
    return f"{base}/{digito}"


def gerar_cpf_ficticio(index: int) -> str:
    """Gera um CPF fictício formatado."""
    base = f"{100 + (index % 900):03d}.{200 + (index % 800):03d}.{300 + (index % 700):03d}"
    digito = f"{index % 100:02d}"
    return f"{base}-{digito}"


@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_internal_data(db: Session = Depends(get_db)):
    """
    Insere 200 registros fictícios em cada uma das 5 tabelas principais:
    - pessoas
    - classificacao
    - movimento_contas
    - parcelas_contas
    - movimento_contas_has_classificacao

    Útil para popular o sistema rapidamente com dados de teste realistas.
    """
    # Criar 200 pessoas com dados variados e realistas
    pessoas_objs: list[Pessoas] = []
    tipos_pessoa = ["FORNECEDOR", "CLIENTE", "FATURADO"]
    status_pessoa = ["ATIVO", "INATIVO"]
    
    for i in range(200):
        tipo = random.choice(tipos_pessoa)
        nome_base = random.choice(NOMES_EMPRESAS if tipo == "FORNECEDOR" else NOMES_PESSOAS)
        
        pessoa = Pessoas(
            tipo=tipo,
            razaosocial=f"{nome_base} {i + 1}",
            fantasia=f"{nome_base.split()[0]} {i + 1}" if " " in nome_base else f"{nome_base} {i + 1}",
            documento=gerar_cnpj_ficticio(i) if tipo == "FORNECEDOR" else gerar_cpf_ficticio(i),
            status=status_pessoa[0] if i % 10 != 0 else status_pessoa[1],  # 10% inativos
        )
        db.add(pessoa)
        pessoas_objs.append(pessoa)

    db.flush()  # Garante que ids estejam disponíveis

    # Criar 200 classificações variadas
    classificacoes_objs: list[Classificacao] = []
    receitas = DESCRICOES_CLASSIFICACAO_RECEITA.copy()
    despesas = DESCRICOES_CLASSIFICACAO_DESPESA.copy()
    
    for i in range(200):
        if i < len(receitas):
            tipo = "RECEITA"
            descricao = receitas[i % len(receitas)]
        elif i < len(receitas) + len(despesas):
            tipo = "DESPESA"
            descricao = despesas[(i - len(receitas)) % len(despesas)]
        else:
            tipo = "RECEITA" if i % 2 == 0 else "DESPESA"
            descricao = f"{tipo} Genérica {i + 1}"
        
        classificacao = Classificacao(
            tipo=tipo,
            descricao=descricao,
            status="ATIVO" if i % 15 != 0 else "INATIVO",  # ~7% inativos
        )
        db.add(classificacao)
        classificacoes_objs.append(classificacao)

    db.flush()

    # Criar 200 movimentos com dados variados
    movimentos_objs: list[MovimentoContas] = []
    today = date.today()
    tipos_movimento = ["PAGAR", "RECEBER"]
    status_movimento = ["ABERTO", "FECHADO", "CANCELADO"]
    
    for i in range(200):
        fornecedor = pessoas_objs[i % len(pessoas_objs)]
        faturado = pessoas_objs[(i + 1) % len(pessoas_objs)]
        tipo = random.choice(tipos_movimento)
        
        # Valores variados entre 50 e 10000
        valor_base = Decimal(str(random.randint(50, 10000)))
        valor_total = valor_base + Decimal(str(random.randint(0, 99))) / 100
        
        movimento = MovimentoContas(
            tipo=tipo,
            numeronotafiscal=f"NF-{1000 + i:05d}",
            dataemissao=today - timedelta(days=random.randint(0, 365)),  # Último ano
            descricao=random.choice(DESCRICOES_MOVIMENTOS),
            status=status_movimento[0] if i % 20 != 0 else random.choice(status_movimento[1:]),  # 5% não abertos
            valortotal=float(valor_total),
            Pessoas_idFornecedorCliente=fornecedor.idPessoas,
            Pessoas_idfaturado=faturado.idPessoas,
        )
        db.add(movimento)
        movimentos_objs.append(movimento)

    db.flush()

    # Criar 200 parcelas variadas (1-6 parcelas por movimento)
    parcelas_objs: list[ParcelasContas] = []
    status_parcela = ["PENDENTE", "PAGA", "VENCIDA"]
    
    for i, movimento in enumerate(movimentos_objs[:200]):
        num_parcelas = random.randint(1, 6)
        valor_parcela_base = Decimal(str(movimento.valortotal)) / Decimal(str(num_parcelas))
        
        for parcela_num in range(1, num_parcelas + 1):
            # Ajustar última parcela para compensar arredondamentos
            if parcela_num == num_parcelas:
                valor_parcela = float(Decimal(str(movimento.valortotal)) - 
                                     (valor_parcela_base * Decimal(str(num_parcelas - 1))))
            else:
                valor_parcela = float(valor_parcela_base)
            
            # Status variado
            if parcela_num <= num_parcelas // 2:
                status = status_parcela[0]  # PENDENTE
                valor_pago = 0.0
                data_pagamento = None
            elif parcela_num == num_parcelas // 2 + 1:
                status = status_parcela[1]  # PAGA
                valor_pago = valor_parcela
                data_pagamento = movimento.dataemissao + timedelta(days=random.randint(0, 30))
            else:
                status = random.choice(status_parcela)
                valor_pago = valor_parcela if status == "PAGA" else random.uniform(0, valor_parcela)
                data_pagamento = movimento.dataemissao + timedelta(days=random.randint(0, 60)) if status == "PAGA" else None
            
            identificacao = f"NF-{movimento.numeronotafiscal.split('-')[1]}-P{parcela_num:02d}"
            
            parcela = ParcelasContas(
                identificacao=identificacao,
                numero_parcela=parcela_num,
                valorparcela=valor_parcela,
                valorpago=valor_pago,
                valorsaldo=max(valor_parcela - valor_pago, 0.0),
                datavencimento=movimento.dataemissao + timedelta(days=30 * parcela_num),
                datapagamento=data_pagamento,
                statusparcela=status,
                MovimentoContas_idMovimentoContas=movimento.idMovimentoContas,
            )
            db.add(parcela)
            parcelas_objs.append(parcela)

    db.flush()

    # Criar 200 relações movimento x classificação (alguns movimentos podem ter múltiplas classificações)
    assoc_values = []
    for i, movimento in enumerate(movimentos_objs[:200]):
        # Cada movimento pode ter 1-3 classificações relacionadas
        num_classificacoes = random.randint(1, 3)
        classificacoes_usadas = set()
        
        for _ in range(num_classificacoes):
            classificacao = classificacoes_objs[random.randint(0, len(classificacoes_objs) - 1)]
            # Evitar duplicatas no mesmo movimento
            if classificacao.idClassificacao not in classificacoes_usadas:
                assoc_values.append(
                    {
                        "MovimentoContas_idMovimentoContas": movimento.idMovimentoContas,
                        "Classificacao_idClassificacao": classificacao.idClassificacao,
                    }
                )
                classificacoes_usadas.add(classificacao.idClassificacao)

    if assoc_values:
        db.execute(movimento_contas_has_classificacao.insert(), assoc_values)

    db.commit()

    return {
        "message": "Dados fictícios inseridos com sucesso.",
        "inserted": {
            "pessoas": len(pessoas_objs),
            "classificacao": len(classificacoes_objs),
            "movimento_contas": len(movimentos_objs),
            "parcelas_contas": len(parcelas_objs),
            "movimento_contas_has_classificacao": len(assoc_values),
        },
    }


@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_internal_data(db: Session = Depends(get_db)):
    """
    Remove TODOS os registros das 5 tabelas principais:
    - movimento_contas_has_classificacao
    - parcelas_contas
    - movimento_contas
    - classificacao
    - pessoas

    ⚠️ ATENÇÃO: Esta operação é destrutiva e limpa completamente os dados.
    """
    # Apagar primeiro as tabelas dependentes (filhas) para respeitar FKs
    deleted_assoc = db.execute(movimento_contas_has_classificacao.delete()).rowcount
    deleted_parcelas = db.query(ParcelasContas).delete(synchronize_session=False)
    deleted_movimentos = db.query(MovimentoContas).delete(synchronize_session=False)
    deleted_classificacoes = db.query(Classificacao).delete(synchronize_session=False)
    deleted_pessoas = db.query(Pessoas).delete(synchronize_session=False)

    db.commit()

    return {
        "message": "Dados internos resetados com sucesso.",
        "deleted": {
            "movimento_contas_has_classificacao": deleted_assoc,
            "parcelas_contas": deleted_parcelas,
            "movimento_contas": deleted_movimentos,
            "classificacao": deleted_classificacoes,
            "pessoas": deleted_pessoas,
        },
    }


