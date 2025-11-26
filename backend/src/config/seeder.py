from sqlalchemy.orm import Session
from ..models.ddl_models import Pessoas
from ..models.classificacao_models import Classificacao

def seed_db(db: Session) -> None:
    """
    Popula o banco de dados com dados iniciais se estiver vazio.
    """
    seed_pessoas(db)
    seed_classificacoes(db)

def seed_pessoas(db: Session) -> None:
    """Insere pessoas mockadas se a tabela estiver vazia."""
    count = db.query(Pessoas).count()
    if count > 0:
        return

    print("🌱 Semeando tabela Pessoas...")
    
    pessoas_mock = [
        {
            "tipo": "FORNECEDOR",
            "razaosocial": "TECH SOLUTIONS LTDA",
            "fantasia": "TECH SOL",
            "documento": "12.345.678/0001-90",
            "status": "ATIVO"
        },
        {
            "tipo": "FORNECEDOR",
            "razaosocial": "COMERCIO DE ALIMENTOS SILVA",
            "fantasia": "MERCADO SILVA",
            "documento": "98.765.432/0001-10",
            "status": "ATIVO"
        },
        {
            "tipo": "CLIENTE",
            "razaosocial": "JOAO DA SILVA",
            "fantasia": "JOAO",
            "documento": "123.456.789-00",
            "status": "ATIVO"
        },
        {
            "tipo": "FORNECEDOR",
            "razaosocial": "DISTRIBUIDORA NORTE S.A.",
            "fantasia": "DISTRIBUIDORA NORTE",
            "documento": "11.222.333/0001-44",
            "status": "ATIVO"
        },
        {
            "tipo": "CLIENTE",
            "razaosocial": "MARIA OLIVEIRA CONSULTORIA",
            "fantasia": "MARIA CONSULT",
            "documento": "55.666.777/0001-88",
            "status": "ATIVO"
        },
        {
            "tipo": "FORNECEDOR",
            "razaosocial": "POSTO DE COMBUSTIVEL ESTRELA",
            "fantasia": "POSTO ESTRELA",
            "documento": "99.888.777/0001-66",
            "status": "ATIVO"
        },
        {
            "tipo": "FORNECEDOR",
            "razaosocial": "PAPELARIA CENTRAL",
            "fantasia": "PAPELARIA CENTRAL",
            "documento": "44.555.666/0001-22",
            "status": "ATIVO"
        },
        {
            "tipo": "CLIENTE",
            "razaosocial": "CONDOMINIO RESIDENCIAL FLORES",
            "fantasia": "CONDOMINIO FLORES",
            "documento": "33.444.555/0001-11",
            "status": "ATIVO"
        },
        {
            "tipo": "FORNECEDOR",
            "razaosocial": "SERVICOS DE LIMPEZA GERAL",
            "fantasia": "LIMPEZA GERAL",
            "documento": "77.888.999/0001-00",
            "status": "INATIVO"
        },
        {
            "tipo": "CLIENTE",
            "razaosocial": "PEDRO SANTOS MEI",
            "fantasia": "PEDRO DEV",
            "documento": "22.333.444/0001-55",
            "status": "ATIVO"
        }
    ]

    for p_data in pessoas_mock:
        pessoa = Pessoas(**p_data)
        db.add(pessoa)
    
    db.commit()
    print(f"✅ {len(pessoas_mock)} pessoas inseridas com sucesso!")

def seed_classificacoes(db: Session) -> None:
    """Insere classificações padrão se a tabela estiver vazia."""
    count = db.query(Classificacao).count()
    if count > 0:
        return

    print("🌱 Semeando tabela Classificacao...")
    
    classificacoes_mock = [
        {"tipo": "DESPESA", "descricao": "Material de Escritório", "status": "ATIVO"},
        {"tipo": "DESPESA", "descricao": "Aluguel", "status": "ATIVO"},
        {"tipo": "DESPESA", "descricao": "Energia Elétrica", "status": "ATIVO"},
        {"tipo": "DESPESA", "descricao": "Combustível", "status": "ATIVO"},
        {"tipo": "DESPESA", "descricao": "Manutenção de Veículos", "status": "ATIVO"},
        {"tipo": "DESPESA", "descricao": "Salários", "status": "ATIVO"},
        {"tipo": "RECEITA", "descricao": "Venda de Produtos", "status": "ATIVO"},
        {"tipo": "RECEITA", "descricao": "Prestação de Serviços", "status": "ATIVO"},
        {"tipo": "RECEITA", "descricao": "Rendimentos de Aplicação", "status": "ATIVO"}
    ]

    for c_data in classificacoes_mock:
        classificacao = Classificacao(**c_data)
        db.add(classificacao)
    
    db.commit()
    print(f"✅ {len(classificacoes_mock)} classificações inseridas com sucesso!")
