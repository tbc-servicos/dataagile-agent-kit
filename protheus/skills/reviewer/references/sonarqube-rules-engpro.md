# Regras SonarQube — EngPro TOTVS (catálogo oficial completo)

> **Gerado por `scripts/sync-sonar-rules.cjs` a partir de https://sonar-rules.engpro.totvs.com.br — não edite à mão.**
> Rode o script para ressincronizar quando a TOTVS publicar regras novas (o CI verifica com `--check`).

**49 regras** — 39 BUG · 9 CODE SMELL · 1 VULNERABILIDADE

## Índice

| Código | Tipo | Descrição |
|--------|------|-----------|
| [CA0000](#ca0000) | BUG | Error de compilação |
| [CA1000](#ca1000) | BUG | Chamada inválida de drive ISAM |
| [CA1001](#ca1001) | CODE SMELL | Uso indevido de Bloqueio Exclusivo no FileSystem/RootPath da aplicação. |
| [CA1001-2](#ca1001-2) | CODE SMELL | Ofensor para SmartERP com FileSystem compartilhado. |
| [CA1002](#ca1002) | BUG | Chamada de API não permitida em transação |
| [CA1003](#ca1003) | BUG | Uso não permitido de chamada de API em LOOP |
| [CA1003-2](#ca1003-2) | CODE SMELL | Uso de chamada de API em LOOP a ser avaliado  |
| [CA1004](#ca1004) | CODE SMELL | Uso não permitido de chamada de API de Console |
| [CA1006](#ca1006) | CODE SMELL | Uso de Função/Classe Descontinuada - AllUsers |
| [CA2000](#ca2000) | BUG | Uso não permitido do Metadados - SM0 |
| [CA2001](#ca2001) | BUG | Uso não permitido do Metadados - SIX |
| [CA2001-2](#ca2001-2) | BUG | Leitura não permitida do Metadados - SIX |
| [CA2002](#ca2002) | BUG | Uso não permitido de atribuição do Metadados - SX1 |
| [CA2002-2](#ca2002-2) | BUG | Formato de leitura não permitida do Metadados - SX1 |
| [CA2003](#ca2003) | BUG | Uso não permitido do Metadados - SX2 |
| [CA2003-2](#ca2003-2) | BUG | Uso não permitido do Metadados - SX2 |
| [CA2004](#ca2004) | BUG | Uso não permitido do Metadados - SX3 |
| [CA2004-2](#ca2004-2) | BUG | Formato de leitura não permitido do Metadados - SX3 |
| [CA2005](#ca2005) | BUG | Uso indevido do Metadados - SX7 |
| [CA2005-2](#ca2005-2) | BUG | Uso indevido de leitura Metadados - SX7 |
| [CA2006](#ca2006) | BUG | Uso indevido do Metadados - SX9 |
| [CA2006-2](#ca2006-2) | BUG | Uso indevido de leitura do Metadados - SX9 |
| [CA2007](#ca2007) | BUG | Uso não permitido do Metadados - SXA |
| [CA2008](#ca2008) | BUG | Uso não permitido do Metadados - SXB |
| [CA2008-2](#ca2008-2) | BUG | Uso não permitido de leituro do Metadados - SXB |
| [CA2009](#ca2009) | BUG | Uso descontinuado de atribuição e leitura do Metadados - SX5 |
| [CA2009-2](#ca2009-2) | BUG | Uso descontinuado de atribuição e leitura do Metadados - SX5 |
| [CA2010](#ca2010) | BUG | Uso descontinuado de leitura e atualização do Metadados - SX6 |
| [CA2010-2](#ca2010-2) | BUG | Uso descontinuado de leitura do Metadados - SX6 |
| [CA2011](#ca2011) | BUG | Uso inválido do Metadados - SXG |
| [CA2011-2](#ca2011-2) | BUG | Uso inválido de leitura do Metadados - SXG |
| [CA2012](#ca2012) | BUG | Uso descontinuado do Metadados - SXD |
| [CA2012-2](#ca2012-2) | BUG | Uso descontinuado de leitura do Metadados - SXD |
| [CA2013](#ca2013) | BUG | Uso não permitido das tabelas de Framework |
| [CA2014](#ca2014) | BUG | Uso inválido do Metadados - SX1 |
| [CA2015](#ca2015) | CODE SMELL | Sobrescrita de FormCommit não recomendada |
| [CA2016](#ca2016) | BUG | Funções de erro/Log sem String de Internacionalização |
| [CA2017](#ca2017) | BUG | Uso não permitido de API SPF |
| [CA2018](#ca2018) | BUG | Uso não permitido de API |
| [CA2019](#ca2019) | BUG | Uso de funções de leitura/gravação binária não permitido |
| [CA2020](#ca2020) | BUG | Uso de Função/Classe Descontinuada |
| [CA2021](#ca2021) | BUG | Uso de tabela/campos descontinuados SE5 |
| [CA2022](#ca2022) | BUG | Uso não permitido de função restrita StaticCall |
| [CA2023](#ca2023) | BUG | Uso não permitido de função restrita PTInternal |
| [CA2050](#ca2050) | VULNERABILIDADE | Sql Inject |
| [CA2052](#ca2052) | CODE SMELL | Senha Exposta |
| [CA3001](#ca3001) | CODE SMELL | Include em lower case |
| [CA3002](#ca3002) | BUG | Herança feita de forma incorreta |
| [CA4000](#ca4000) | CODE SMELL | Codigo limpo\| não utilização de IIF |

## Detalhe e correção

### CA0000

**Tipo:** BUG

CA0000: Compile error

**Causas**

Um erro de compilação ocorreu as possíveis causas são:

- Utilização de caracter inválido

- Utilização de codepage inválido

- Utilização de sintaxe inválida ou não admitido pelo parser

- Fechamento inadequado de string

**Descrição da Regra**

A regra avalia a sintaxe da linguagem admitida e possíveis erros de
caracteres inválidos ou utilização de outro charset na configuração da
IDE. O charset recomendado é o Windows-1252.

**Como corrigir a violação**

Para corrigir a violação, identifique e corrija uma das causas mencionadas
acima.

Apesar da linguagem admitir diversos fechamentos de bloco, o guia de boas
práticas admite apenas os tipos comuns e documentados, por exemplo:

- If/EndIf

- Do Case/EndCase

- Do While/While/EndDo

- For/Next

- Begin Transaction/End Transaction

- Begin Sequence/End Sequence

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA1000

**Tipo:** BUG

CA1000: InvalidLocalDriverCallFunction

**Causas**

O uso de drive ISAM na linha Microsiga Protheus foi descontinuado.

**Descrição da Regra**

A partir da versão 12 do Microsiga Protheus deve ser evitado o uso de
qualquer driver ISAM. As rotinas que fazem uso de arquivos temporários
devem passar a utilizar TempTables Relacionais e as rotinas que fazem
exportação de dados via drive ISAM devem passar a exportar dados em
CSV.

A regra avalia quaisquer tentativas de acesso à um Driver ISAM, tais como:

- MSCREATE()

- MSFILE()

- MSCOPYFILE

- MSERASE

- DBCREATE()

- DBUSEAREA()

- CRIATRAB(.T.)

- COPY TO

**Como corrigir a violação**

Recomenda-se o uso da API
FWTemporaryTable
para a migração dos arquivos temporários, com a adoção de lógica
Relacional. O uso desta API em modo ISAM deve ser evitado, sob risco de
perda significativa de desempenho, conforme tabela abaixo:

Para a exportação de dados no formato CSV, utilize a API ExpExcel.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

Clientes que possuem a licença do CtreeServer podem suprimir esta
advertência, porém devem ter ciência da perda de desempenho deste modelo
em relação a nova recomendação de uso.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA1001

**Tipo:** CODE SMELL

CA1001: InvalidUseDiskSemaphore

**Causas**

Uso indevido de Bloqueio Exclusivo em disco e/ou criação/abertura de
arquivo em modo exclusivo em qualquer diretório do RootPath do Application
Server.

**Descrição da Regra**

A partir da versão 12 do Microsiga Protheus deve ser evitado o uso de
qualquer tipo de semaforo em disco. As rotinas que fazem uso de arquivos
temporários como semaforo devem ser recodificadas de modo não fazer uso de
Bloqueio Exclusivo.

A regra avalia quaisquer tentativas de criação ou abertura de um arquivo
exclusivo em disco.

**Como corrigir a violação**

Recomenda-se o uso da API
LockByName
para Bloqueio Exclusivo, porém a mesma deve ser utilizada como ultimo
recurso, sendo que a recomendado é não fazer uso de Bloqueio Exclusivo.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA1001-2

**Tipo:** CODE SMELL

CA1001-2: InvalidUseFileSystem

**Causas**

Ofensor para SmartERP com FileSystem compartilhado em qualquer diretório
do RootPath do Application Server.

**Descrição da Regra**

A partir da versão 12 do Microsiga Protheus deve ser evitado o uso de
qualquer tipo consulta e criação de arquivos no FileSystem pois o mesmo
trabalhará no modo compartilhado/efêmero. As rotinas que fazem uso de
arquivos dentro do FileSystem devem ser revistas e adequadas para
trabalharem com o novo método de uso do FileSystem.

A regra avalia quaisquer tentativas de criação ou abertura de um arquivo
exclusivo em disco.

**Quando suprimir a advertência**

Quando a função consultar/criar um arquivo no FileSystem criado pela mesma
ou pelo processo que a iniciou e quando o mesmo será removido após o
término da execução

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA1002

**Tipo:** BUG

CA1002: InvalidFunctionTransationScope

**Causas**

Uso indevido de chamada de interface dentro de uma transação.

**Descrição da Regra**

A regra avalia quaisquer tentativa de chamad de interface dentro de uma
transação, tais como:

- MSGALERT()

- MSGYESNO()

- MSGNOYES

- ALERT

- AVISO()

- HELP()

- PERGUNTE()

- PARAMBOX()

**Como corrigir a violação**

Alterar a lógica do programa para que a transação não tenha nenhuma
interrupção de interface

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA1003

**Tipo:** BUG

CA1003: InvalidLoopFunction

**Causas**

Uso indevido de chamada de API em loop que reconhecidamente provoca baixo
desempenho do produto e pode ser evitada.

**Descrição da Regra**

A regra avalia tentativas de chamadas de API em loop que devem ser
evitadas. A regra avalia as seguintes chamadas em loop:

- GETMV()

- EXISTBLOCK()

- API do perfil do usuário

**Como corrigir a violação**

Alterar a lógica do programa para que a chama seja feita fora do loop,
utilizando uma variável local para armazenar o resultado.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA1003-2

**Tipo:** CODE SMELL

CA1003-2: AttentionLoopFunction

**Causas**

Uso de chamada de API em loop à ser avaliada, pois pode reconhecidamente
provocar baixo desempenho do produto e pode ser evitada.

**Descrição da Regra**

A regra avalia tentativas de chamadas de API em loop que devem ser
evitadas. A regra avalia as seguintes chamadas em loop:

- TYPE

- PERGUNTE

**Como corrigir a violação**

Alterar a lógica do programa para que a chama seja feita fora do loop se
possível, utilizando uma variável local para armazenar o resultado.

Caso o uso do Type seja para vericar a existencia de Propriedades XML,
recomenda-se a substituição completa do tratamento de XML para a classe
nova TXMLMAnager. https://tdn.totvs.com/display/tec/Classe+TXmlManager

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA1004

**Tipo:** CODE SMELL

CA1004: InvalidLogFunction

**Causas**

Uso indevido de chamada de API de Log.

**Descrição da Regra**

A regra avalia tentativas de chamadas de API de log que devem ser
suprimidas e o não uso de internacionalização (I18N). A regra avalia as
seguintes chamadas:

- CONOUT()

- OUTERR()

- OUTSTD()

- ?

- ??

**Como corrigir a violação**

Alterar a chamada de API para utilizar a API de Log padrão e o padrão de
internacionalização.

A funções permitidas são:

-
FWLogMsg

-
I18N

**Quando suprimir a advertência**

A regra deve ser suprimida quando for referente a uma Brand do produto.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA1006

**Tipo:** CODE SMELL

CA1006: Uso de Função/Classe Descontinuada

**Causas**

Uso de funções descontinuadas.

**Descrição da Regra**

A regra avalia o uso de funções que foram descontinuadas. Estão sendo
avaliadas atualmente:

- AllUsers()

**Como corrigir a violação**

Alterar a função substituta ou alterar a aplicação para não fazer o uso
da(s) função(ões):

- AllUsers():

-
Em seu lugar, deve ser utilizada a função FWSFALLUSERS() -
http://tdn.totvs.com/display/PROT/FWSFALLUSERS

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2000

**Tipo:** BUG

CA2000: DictionaryAssigmentSM0

**Causas**

Uso não permitido da tabela de empresas (SM0).

**Descrição da Regra**

A regra avalia as tentativas de manipulação da tabela do metadados.

Em futuras versões do produto o alias SM0 não será aberto em modo ISAM,
sendo obrigatório o uso Queries para Leitura.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados e remover o uso de qualquer API de manipulação do metadados.
Toda e qualquer manipulação de dados deve ser feita apenas pelo módulo
Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2001

**Tipo:** BUG

CA2001: DictionaryAssigmentSIX

**Causas**

Uso não permitido do metadados de Índices (SIX).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do
metadados.

Em futuras versões do produto o alias SIX não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados e remover o uso de qualquer API de manipulção do metadados. Toda
e qualquer manipulação de dados deve ser feita apenas pelo módulo
Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2001-2

**Tipo:** BUG

CA2001-2: DictionaryAccessSIX

**Causas**

Uso não permitido de leitura de metadados de Índices (SIX).

**Descrição da Regra**

A regra avalia as tentativas de leitura da tabela do metadados.

Em futuras versões do produto o alias SIX não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2002

**Tipo:** BUG

CA2002: DictionaryAssigmentSX1

**Causas**

Uso não permitido de atribuição do metadados de Perguntas (SX1).

**Descrição da Regra**

A regra avalia as tentativas de manipulação da tabela do metadados.

Em futuras versões do produto o alias SX1 não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões. Exemplo: Pergunte

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados (Pergunte) e remover o uso de qualquer API de manipulção do
metadados. Toda e qualquer manipulação de dados deve ser feita apenas pelo
módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2002-2

**Tipo:** BUG

CA2002-2: DictionaryAccessSX1

**Causas**

Uso não permitido de leitura do metadados de Perguntas (SX1).

**Descrição da Regra**

A regra avalia as tentativas de leitura da tabela do metadados.

Em futuras versões do produto o alias SX1 não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões. Exemplo: Pergunte

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados (Pergunte) e remover o uso de qualquer API de manipulção do
metadados. Toda e qualquer manipulação de dados deve ser feita apenas pelo
módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2003

**Tipo:** BUG

CA2003: DictionaryAssigmentSX2

**Causas**

Uso não permitido do metadados de Tabelas (SX2).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do
metadados.

Em futuras versões do produto o alias SX2 não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões. Exemplo: RetSqlName,
X2Nome

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados (RetSqlName) e remover o uso de qualquer API de manipulção do
metadados. Toda e qualquer manipulação de dados deve ser feita apenas pelo
módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2003-2

**Tipo:** BUG

CA2003: DictionaryAccessSX2

**Causas**

Uso não permitido de leitura de  metadados de Tabelas (SX2).

**Descrição da Regra**

A regra avalia as tentativas de leitura da tabela do metadados.

Em futuras versões do produto o alias SX2 não estará mais disponível para uso, sendo obrigatório o uso das API's padrões. Exemplo: RetSqlName, X2Nome

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados (RetSqlName).

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2004

**Tipo:** BUG

CA2004: DictionaryAssigmentSX3

**Causas**

Uso não permitido do metadados de Descrição das propriedades de tabelas
(SX3).

**Descrição da Regra**

A regra avalia as tentativas de manipulação da tabela do metadados.

Ao contrário de outras regras de violação do dicionário de dados, o SX3
teve usa estrutura alterada e a gravação indevida de algumas propriedades
da tabela pode causar prejuízos ao bom funcionamento do sistema.

Em futuras versões do produto o alias SX3 será aberto e fechado conforme a
demanda, sendo obrigatório o uso das API's padrões para evitar perda de
desempenho.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados e remover o uso de qualquer API de manipulção do metadados. Toda
e qualquer manipulação de dados deve ser feita apenas pelo módulo
Configurador ou pela rotina de atualização de versão. + +Veja também de a
documentação da função FWSX3Util, para acessar os dados de campos
+http://tdn.totvs.com/display/PROT/FWSX3Util

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2004-2

**Tipo:** BUG

CA2004-2: DictionaryAccessSX3

**Causas**

Uso não permitido de leitura do metadados de Descrição das propriedades de
tabelas (SX3).

**Descrição da Regra**

A regra avalia as tentativas de leitura da tabela do metadados.

Em futuras versões do produto o alias SX3 será aberto e fechado conforme a
demanda, sendo obrigatório o uso das API's padrões para evitar perda de
desempenho.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados e remover o uso de qualquer API de manipulção do metadados. Toda
e qualquer manipulação de dados deve ser feita apenas pelo módulo
Configurador ou pela rotina de atualização de versão. +Veja também de a
documentação da função FWSX3Util, para acessar os dados de campos
+http://tdn.totvs.com/display/PROT/FWSX3Util +

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2005

**Tipo:** BUG

CA2005: DictionaryAssigmentSX7

**Causas**

Uso indevido do metadados de Gatilhos (SX7).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do
metadados.

Em futuras versões do produto o alias SX7 não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados e remover o uso de qualquer API de manipulção do metadados. Toda
e qualquer manipulação de dados deve ser feita apenas pelo módulo
Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

**Regras relacionadas**

---

### CA2005-2

**Tipo:** BUG

CA2005-2: DictionaryAccessSX7

**Causas**

Uso indevido de leitura metadados de Gatilhos (SX7).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do
metadados.

Em futuras versões do produto o alias SX7 não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados. Toda e qualquer manipulação de dados deve ser feita apenas pelo
módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

**Regras relacionadas**

---

### CA2006

**Tipo:** BUG

CA2006: DictionaryAssigmentSX9

**Causas**

Uso indevido do metadados de Relacionamento (SX9).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do
metadados.

Em futuras versões do produto o alias SX9 não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados e remover o uso de qualquer API de manipulção do metadados. Toda
e qualquer manipulação de dados deve ser feita apenas pelo módulo
Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2006-2

**Tipo:** BUG

CA2006-2: DictionaryAccessSX9

**Causas**

Uso indevido de leitura metadados de Relacionamento (SX9).

**Descrição da Regra**

A regra avalia as tentativas de leitura da tabela do metadados.

Em futuras versões do produto o alias SX9 não estará mais disponível para
uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do
metadados.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2007

**Tipo:** BUG

CA2007: DictionaryAssigmentSXA

**Causas**

Uso não permitido do metadados das Propriedades de Pastas (SXA).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do metadados.

Em futuras versões do produto o alias SXA não estará mais disponível para uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados e remover o uso de qualquer API de manipulção do metadados.
Toda e qualquer manipulação de dados deve ser feita apenas pelo módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2008

**Tipo:** BUG

CA2008: DictionaryAssigmentSXB

**Causas**

Uso não permitido do metadados de LookUP/Consultas (SXB).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do metadados.

Em futuras versões do produto o alias SXB não estará mais disponível para uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados e remover o uso de qualquer API de manipulção do metadados.
Toda e qualquer manipulação de dados deve ser feita apenas pelo módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2008-2

**Tipo:** BUG

CA2008: DictionaryAccessSXB

**Causas**

Uso não permitido de leitura do metadados de LookUP/Consultas (SXB).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do metadados.

Em futuras versões do produto o alias SXB não estará mais disponível para uso, sendo obrigatório o uso das API's padrões de forma indireta.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2009

**Tipo:** BUG

CA2009: DictionaryAssigmentSX5

**Causas**

Uso descontinuado do metadados de Tabelas Genéricas (SX5).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do metadados.

O uso de atribuição nesta tabela comprovou-se equivocado e foi descontinuado uma vez que identificamos bloqueio exclusivo de processos de negócio quando em transação.

Em futuras versões do produto o alias SX5 será aberto e fechado conforme a demanda, sendo obrigatório o uso das API's padrões para evitar perda de desempenho.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados e remover o uso de qualquer API de manipulção do metadados.
Toda e qualquer manipulação de dados deve ser feita apenas pelo módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2009-2

**Tipo:** BUG

CA2009: DictionaryAccessSX5

**Causas**

Uso descontinuado do metadados de Tabelas Genéricas (SX5).

**Descrição da Regra**

A regra avalia as tentativas de leitura de tabela do metadados.

Em futuras versões do produto o alias SX5 será aberto e fechado conforme a demanda, sendo obrigatório o uso das API's padrões para evitar perda de desempenho.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2010

**Tipo:** BUG

CA2010: DictionaryAssigmentSX6

**Causas**

Uso descontinuado de leitura e atualização do metadados de parâmetros (SX6).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do metadados.

O uso de atribuição nesta tabela comprovou-se equivocado e foi descontinuado uma vez que identificamos bloqueio exclusivo de processos de negócio quando em transação.

Em futuras versões do produto o alias SX6 não será aberto, sendo obrigatório o uso das API's padrões. Exemplo: GetMV/SuperGetMV

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados e remover o uso de qualquer API de manipulação do metadados.
Toda e qualquer manipulação de dados deve ser feita apenas pelo módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2010-2

**Tipo:** BUG

CA2010-2: DictionaryAccessSX6

**Causas**

Uso descontinuado de leitura do metadados de parâmetros (SX6).

**Descrição da Regra**

A regra avalia as tentativas de leitura  da tabela do metadados.

O uso de atribuição nesta tabela comprovou-se equivocado e foi descontinuado uma vez que identificamos bloqueio exclusivo de processos de negócio quando em transação.

Em futuras versões do produto o alias SX6 não será aberto, sendo obrigatório o uso das API's padrões. Exemplo: GetMV/SuperGetMV

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2011

**Tipo:** BUG

CA2011: DictionaryAssigmentSXG

**Causas**

Uso indevido do metadados de grupos de campos (SXG).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do metadados.

Em futuras versões do produto o alias SXG não será aberto, sendo obrigatório o uso das API's padrões.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados e remover o uso de qualquer API de manipulação do metadados.
Toda e qualquer manipulação de dados deve ser feita apenas pelo módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2011-2

**Tipo:** BUG

CA2011-2: DictionaryAccessSXG

**Causas**

Uso indevido da leitura do metadados de grupos de campos (SXG).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do metadados.

Em futuras versões do produto o alias SXG não será aberto, sendo obrigatório o uso das API's padrões.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2012

**Tipo:** BUG

CA2012: DictionaryAssigmentSXD

**Causas**

Uso descontinuado do metadados do Schedule (SXD).

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação da tabela do metadados.

Esta tabela do metadados deve seu uso descontinuado e foi substituída pela padronização SchedDef.

Em futuras versões do produto o alias SXD será removido.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados e remover o uso de qualquer API de manipulação do metadados.
Toda e qualquer manipulação de dados deve ser feita apenas pelo módulo Configurador ou pela rotina de atualização de versão.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2012-2

**Tipo:** BUG

CA2012-2: DictionaryAccessSXD

**Causas**

Uso descontinuado do metadados do Schedule (SXD).

**Descrição da Regra**

A regra avalia as tentativas de leitura da tabela do metadados.

Esta tabela do metadados deve seu uso descontinuado e foi substituída pela padronização SchedDef.

Em futuras versões do produto o alias SXD será removido.

**Como corrigir a violação**

Alterar a lógica do programa para utilizar as API padrões de leitura do metadados.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2013

**Tipo:** BUG

CA2013: DictionaryAssigment

**Causas**

Acessar diretamenta uma tabela de Framework.

**Descrição da Regra**

A regra avalia as tentativas de leitura e manipulação das tabelas do Framework.

As tabelas do Framework não podem ser manipuladas através de workarea ou por Classes e Funções que não são de Framework

As tabelas do Framework são:

- SX8

- SX9

- SXE

- SXF

- SXH

- SXI

- SXJ

- SXK

- SXL

- SXM

- SXN

- SXO

- SXP

- SXQ

- SXR

- SXS

- SXT

- SXU

- SXV

- SXW

- SXX

- SXY

- SXZ

- XX?

- SPF_???? - Funções de manipução de SuperFile

**Como corrigir a violação**

Utilizar as API's padrões fornecidas.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2014

**Tipo:** BUG

CA2014: FunctionCallDeprecated

**Causas**

Chamada de API/Classe depreciada.

**Descrição da Regra**

A regra avalia o uso de funções/classes que tiveram o seu ciclo de vida encerrado ( DEPRECATED ).

As API deprecidas são:

- PutSX1

**Como corrigir a violação**

Alterar o codigo-fonte para utilizar API em ciclo de vida.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2015

**Tipo:** CODE SMELL

CA2015: Sobrescrita de FormCommit não recomendada

**Causas**

CA2015: Sobrescrita de FormCommit não recomendada.

**Descrição da Regra**

**Como corrigir a violação**

Alterar o codigo-fonte para utilizar API em ciclo de vida.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Interceptação do Commit e Validação MVC - FWModelEvent

---

### CA2016

**Tipo:** BUG

CA2016: Funções de erro/Log sem String de Internacionalização

**Causas**

CA2016: Funções de erro/Log sem String de Internacionalização

**Descrição da Regra**

**Como corrigir a violação**

Alterar o codigo-fonte para utilizar STR.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

---

### CA2017

**Tipo:** BUG

CA2017: Uso não permitido de API SPF

**Causas**

CA2017: Uso não permitido de API SPF

**Descrição da Regra**

Não se deve utilizar funções de API de SPF.

**Como corrigir a violação**

Alterar o codigo-fonte para utilizar funções de Framework.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

---

### CA2018

**Tipo:** BUG

CA2018: Uso não permitido de API

**Causas**

CA2018: Uso não permitido de API

**Descrição da Regra**

Não se deve utilizar funções de API.

**Como corrigir a violação**

Utilize alternativas

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

---

### CA2019

**Tipo:** BUG

CA2019: Uso de funções de leitura/gravação binária não permitido

**Causas**

O uso de funções que fazem a gravação/leitura binária de dados.

**Descrição da Regra**

A regra avalia o uso das funções de gravação binárias

FWConvRese()

FWConvBin()

Bin2Str()

Str2Bin()

X3Reserv()

**Como corrigir a violação**

Alterar o código-fonte para:

FWConvRese() Retirar do fonte, pois o uso desta função não é permitido

FWConvBin() Retirar do fonte, pois o uso desta função não é permitido

Bin2Str() Quando o uso desta função é no sentido de determinar a obrigatoriedade do campo utilizar a função X3OBRIGAT(), em outras situações retirar do fonte

Str2Bin() Avaliar a necessidade de uso de dado binário e se for o caso retirar do fonte. Alguns bancos de dados não suportam os caracteres binários.

X3Reserv() Quando o uso desta função é no sentido de determinar a obrigatoriedade do campo utilizar a função X3OBRIGAT(), em outras situações retirar do fonte

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

---

### CA2020

**Tipo:** BUG

CA2020: Uso de Função/Classe Descontinuada

**Causas**

CA2020: Uso de funções descontinuadas.

**Descrição da Regra**

A regra avalia o uso de funções que foram descontinuadas

Estão sendo avaliadas atualmente:

AllUsers()

**Como corrigir a violação**

Alterar a função substituta ou alterar a aplicação para não fazer o uso da(s) função(ões):

AllUser() Em seu lugar, deve ser utilizada a função FWSFALLUSERS()    http://tdn.totvs.com/display/PROT/FWSFALLUSERS

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

---

### CA2021

**Tipo:** BUG

CA1000: Uso Inválido de Tabela/Campos SE5

**Causas**

A tabela SE5 (Movimentação bancária) está em processo de descontinuidade.

**Descrição da Regra**

A partir da versão 12 do Microsiga Protheus passamos a gravar os dados de baixa, impostos, movimentos bancários, entre outros, através de um conjunto novo de tabelas em substituição à tabela SE5.

**Como corrigir a violação**

Para a gravação de dados, recomenda-se o uso de ExecAuto das rotinas de baixa envolvidas.

Já para a leitura dos dados, recomenda-se a leitura do documento Reestruturação da tabela SE5 na família de tabelas FKx para melhor entendimento das novas regras/tabelas utilizadas.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2022

**Tipo:** BUG

CA2022: Uso não permitido de função restrita StaticCall

**Causas**

Uso não permitido da função restrita StaticCall

**Descrição da Regra**

Utilizada função não permitida por ser uso interno e restrito. A partir do release 33 fontes customizados iram sinalizar erro de compilação.

**Como corrigir a violação**

Suprimir o uso da função ou alterar o escopo da função chamada pela Staticcall() para o escopo de User Function (em fontes customizados) ou para Function ( em fontes padrão).

Para a exportação de dados no formato CSV, utilize a API ExpExcel.

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

Guia de boas práticas no desenvolvimento AdvPL

---

### CA2023

**Tipo:** BUG

CA2023: Uso não permitido de função restrita PTInternal

**Causas**

Uso não permitido da função restrita PTInternal

**Descrição da Regra**

Utilizada função não permitida por ser uso interno e restrito. A partir do release 33 fontes customizados iram sinalizar erro de compilação.

**Como corrigir a violação**

Suprimir o uso da função. Caso utilizado PTInternal de 1, utilizar função do framework
FWMonitorMsg

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

---

### CA2050

**Tipo:** VULNERABILIDADE

CA2050: Sql Inject

**Causas**

Sql Inject

**Descrição da Regra**

Essa regra visa identificar possível pontos de vunabilidades de ataque de injeção de SQL.

**O que é Sql Inject(injeção de SQL) **

A injeção de SQL é uma técnica de injeção de código que pode destruir seu banco de dados.

A injeção de SQL é uma das técnicas de hacking mais comuns na web.

Vejamos um exemplo:

```advpl
User Function retUserByCode(ctxtUserId as  Character)
local cAlias := "TRB"
dbUseArea( .T. ,"TOPCONN",TcGenQry( ,,"SELECT * FROM Users WHERE UserId = " + ctxtUserId),cAlias, .T. , .T. )
If !((cAlias)->(EOF()))
//Faz Algo
Endif
...
```

Observe o exemplo. O objetivo original do código era criar uma instrução SQL para selecionar um usuário, com um determinado ID de usuário.

Se não houver nada que impeça um usuário de inserir uma entrada "errada", o usuário pode inserir alguma entrada "inteligente" como esta:

Se a função receber no parametro ctxtUserId algo como:

105 OR 1=1

Teremos um SQL Inject

**Como corrigir a violação**

Utilizar funções quer utilizem o conceito de prepare Statement. (Substituição de valores com ? )

Funções que podem ser utilizadas, para correção:

-
FWPreparedStatement

-
TcGenQry2

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

---

### CA2052

**Tipo:** CODE SMELL

CA2052: Senha Exposta

**Causas**

Senha Exposta

**Descrição da Regra**

Senha Exposta no código fonte

**Como corrigir a violação**

Possível senha exposta no código fonte, avaliar possibilidade de substituição da string em um pipeline de deploy

**Quando suprimir a advertência**

Quando o item for um falso positivo

**Regras relacionadas**

---

### CA3001

**Tipo:** CODE SMELL

CA3001: Include em lower case

**Causas**

CA3001: Include em lower case

**Descrição da Regra**

O arquivo de include deve estar em lowcase

**Como corrigir a violação**

troque o texto para low case

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

---

### CA3002

**Tipo:** BUG

CA3002: Herança feita de forma incorreta

**Causas**

CA3002: Herança feita de forma incorreta

**Descrição da Regra**

Herança feita de forma incorretamente, deve-se utilizar LongNameClass.

**Como corrigir a violação**

Troque de LongClassName para LongNameClass

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

---

### CA4000

**Tipo:** CODE SMELL

CA4000: Codigo limpo| não utilização de IIF

**Causas**

Codigo limpo| não utilização de IIF

**Descrição da Regra**

Construções utilizando iif() ou if() dificultam a leitura do codigo, prejudicam o debug e mascaram a cobertura de codigo de teste.

**Como corrigir a violação**

Fazer a construção de codigo de maneira mais limpa, utilizado a estrutura if/else;

**Quando suprimir a advertência**

Não é permitida a supressão de aviso desta regra.

**Regras relacionadas**

---
