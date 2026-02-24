# Felipe Fernandes

<div align="center">

```
Systems Engineer · Python · Open Source Contributor · AI & Backend
```

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/felipe-de-oliveira-fernandes-941763110/)
[![Email](https://img.shields.io/badge/felipe.of.dev@gmail.com-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:felipe.of.dev@gmail.com)
[![Location](https://img.shields.io/badge/São_José_dos_Campos,_Brazil-Remote-lightgrey?style=flat-square)](https://github.com/felipeofdev-ai)

</div>

---

## Open Source

### Home Assistant Core — PR #163908 (em review)

Correcao de bug critico que afetou todos os usuarios de OpenAI e Anthropic apos a atualizacao 2026.1.0.

**Problema:** Os intents `HassStartTimer` e `HassDecreaseTimer` geravam schemas JSON com `anyOf` no nivel raiz — rejeitado pelas APIs da OpenAI e Anthropic com HTTP 400.

**Solucao:** Implementei `sanitize_tool_schema()` em `homeassistant/helpers/llm_schema.py`, um helper compartilhado que sanitiza o schema antes de enviar para qualquer provider LLM. Aplicado em ambas as integracoes (`openai_conversation` e `anthropic`).

```python
# homeassistant/helpers/llm_schema.py
def sanitize_tool_schema(schema: dict[str, Any]) -> dict[str, Any]:
    """Remove root-level anyOf/oneOf/allOf/not/enum before sending to LLM APIs."""
    if not UNSUPPORTED_ROOT_SCHEMA_KEYS.intersection(schema):
        return schema
    sanitized = {k: v for k, v in schema.items() if k not in UNSUPPORTED_ROOT_SCHEMA_KEYS}
    sanitized["required"] = []
    return sanitized
```

**Repositorio:** 84k stars · 2M+ usuarios · Maior projeto open source de automacao residencial do mundo

🔗 [PR #163908](https://github.com/home-assistant/core/pull/163908) · Fecha issues [#160462](https://github.com/home-assistant/core/issues/160462) [#160540](https://github.com/home-assistant/core/issues/160540) [#160565](https://github.com/home-assistant/core/issues/160565)

---

### TheAlgorithms/Python — PR #14281 (em review)

Restauracao de algoritmos quebrados/desabilitados nas categorias Machine Learning, Neural Network e Quantum Computing.

🔗 [PR #14281](https://github.com/TheAlgorithms/Python/pull/14281)

---

## Projetos

### BridgeTrace AI
Plataforma de rastreabilidade financeira usando teoria de grafos e IA generativa. Modela fluxos entre sistemas bancarios (PIX) e redes blockchain com deteccao de anomalias.

**Stack:** Python · FastAPI · NetworkX · PostgreSQL

🔗 [Repositorio](https://github.com/felipeofdev-ai/BridgeTrace-AI) · [Demo](https://felipeofdev-ai.github.io)

---

### TrustHire
Analisador de ofertas de emprego e mensagens de recrutamento com deteccao de sinais de risco usando IA.

**Stack:** Python · FastAPI · Stripe

🔗 [Backend](https://github.com/felipeofdev-ai/trusthire-backend) · [Frontend](https://github.com/felipeofdev-ai/trusthire-frontend)

---

## Stack

```
Languages   Python (principal) · SQL · JavaScript
Backend     FastAPI · REST APIs · PostgreSQL · Redis · Docker
AI / ML     OpenAI API · Anthropic API · LLM integrations · algoritmos do zero
Data        Pandas · NetworkX · ETL pipelines · graph analysis
Quality     mypy · ruff · pytest · type hints · CI/CD
```

---

## Contato

**Remote · UTC-3 · Aberto a oportunidades globais**

[felipe.of.dev@gmail.com](mailto:felipe.of.dev@gmail.com) · [LinkedIn](https://www.linkedin.com/in/felipe-de-oliveira-fernandes-941763110/)
