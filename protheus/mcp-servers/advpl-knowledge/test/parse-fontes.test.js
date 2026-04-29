import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  extractFunctions,
  extractEndpoints,
  extractSmartView,
  extractExecAuto,
  extractMvcPatterns,
  extractIncludes
} from '../parse-fontes.js';

describe('extractFunctions', () => {
  it('extracts User Function with ProtheusDoc', () => {
    const source = `
/*/{Protheus.doc} MyFunc
My function description
/*/
User Function MyFunc(x, y)
  Local result as Character
  result := x + y
Return result
`;
    const results = extractFunctions(source, '/test.prw', 'test');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'MyFunc');
    assert.strictEqual(results[0].type, 'user');
    assert.ok(results[0].protheus_doc.includes('My function description'));
    assert.deepStrictEqual(JSON.parse(results[0].parameters), ['x', 'y']);
  });

  it('extracts Static Function', () => {
    const source = `
Static Function Calculate(a, b, c)
  Return a + b + c
`;
    const results = extractFunctions(source, '/test.prw', 'test');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'Calculate');
    assert.strictEqual(results[0].type, 'static');
    assert.deepStrictEqual(JSON.parse(results[0].parameters), ['a', 'b', 'c']);
  });

  it('extracts TLPP Function', () => {
    const source = `
Function GetData()
  Return Nil
`;
    const results = extractFunctions(source, '/test.tlpp', 'test');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].name, 'GetData');
    assert.strictEqual(results[0].type, 'function');
  });

  it('extracts class declaration', () => {
    const source = `
class MyClass from BaseClass
  public method new() as object
endclass
`;
    const results = extractFunctions(source, '/test.tlpp', 'test');
    assert.ok(results.some(r => r.name === 'MyClass' && r.type === 'class'));
    assert.strictEqual(results.find(r => r.type === 'class').return_type, 'BaseClass');
  });

  it('extracts methods', () => {
    const source = `
method Initialize() as logical class MyClass
  Return .T.

method Calculate(x, y) as numeric class MyClass
  Return x + y
`;
    const results = extractFunctions(source, '/test.tlpp', 'test');
    const methods = results.filter(r => r.type === 'method');
    assert.strictEqual(methods.length, 2);
    assert.ok(methods.some(m => m.name === 'Initialize' && m.return_type === 'logical'));
    assert.ok(methods.some(m => m.name === 'Calculate' && m.return_type === 'numeric'));
  });

  it('handles empty source', () => {
    const results = extractFunctions('', '/test.prw', 'test');
    assert.strictEqual(results.length, 0);
  });

  it('extracts multiple functions from single file', () => {
    const source = `
User Function First()
  Return 1

Static Function Second()
  Return 2

Function Third()
  Return 3
`;
    const results = extractFunctions(source, '/test.prw', 'test');
    assert.strictEqual(results.length, 3);
    assert.ok(results.some(r => r.name === 'First'));
    assert.ok(results.some(r => r.name === 'Second'));
    assert.ok(results.some(r => r.name === 'Third'));
  });
});

describe('extractEndpoints', () => {
  it('extracts @Get endpoint with namespace', () => {
    const source = `
namespace gfin.api.currency

@Get('/api/gfin/v1/currencies')
method currencies() class CurrencyApi
  Return .T.
`;
    const results = extractEndpoints(source, '/test.tlpp', 'gfin');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].path, '/api/gfin/v1/currencies');
    assert.strictEqual(results[0].method, 'GET');
    assert.strictEqual(results[0].namespace, 'gfin.api.currency');
    assert.strictEqual(results[0].function_name, 'currencies');
  });

  it('extracts @Post endpoint', () => {
    const source = `
@Post('/api/items')
method create() class ItemApi
  Return .T.
`;
    const results = extractEndpoints(source, '/test.tlpp', 'api');
    assert.strictEqual(results[0].method, 'POST');
  });

  it('extracts @Put endpoint', () => {
    const source = `
@Put('/api/items/:id')
method update() class ItemApi
  Return .T.
`;
    const results = extractEndpoints(source, '/test.tlpp', 'api');
    assert.strictEqual(results[0].method, 'PUT');
  });

  it('extracts @Delete endpoint', () => {
    const source = `
@Delete('/api/items/:id')
method delete() class ItemApi
  Return .T.
`;
    const results = extractEndpoints(source, '/test.tlpp', 'api');
    assert.strictEqual(results[0].method, 'DELETE');
  });

  it('extracts multiple endpoints', () => {
    const source = `
namespace api.test

@Get('/items')
method list() class ItemApi
  Return .T.

@Get('/items/:id')
method get() class ItemApi
  Return .T.

@Post('/items')
method create() class ItemApi
  Return .T.
`;
    const results = extractEndpoints(source, '/test.tlpp', 'api');
    assert.strictEqual(results.length, 3);
  });

  it('returns empty array when no endpoints', () => {
    const source = `
Function SomeFunc()
  Return Nil
`;
    const results = extractEndpoints(source, '/test.tlpp', 'api');
    assert.strictEqual(results.length, 0);
  });
});

describe('extractSmartView', () => {
  it('extracts SmartView annotation with all attributes', () => {
    const source = `
namespace totvs.protheus.rental

@totvsFrameworkTReportsIntegratedProvider(active=.T., team="SIGALOC", tables="FP0,FP1,FPA", displayName="Rental Report", country="BRA")
class RentalSmartView from IntegratedProvider
  public method new() as object
endclass
`;
    const results = extractSmartView(source, '/test.tlpp', 'rental');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].class_name, 'RentalSmartView');
    assert.strictEqual(results[0].namespace, 'totvs.protheus.rental');
    assert.strictEqual(results[0].team, 'SIGALOC');
    assert.strictEqual(results[0].tables, 'FP0,FP1,FPA');
    assert.strictEqual(results[0].display_name, 'Rental Report');
    assert.strictEqual(results[0].country, 'BRA');
  });

  it('extracts SmartView with name attribute instead of displayName', () => {
    const source = `
@totvsFrameworkTReportsIntegratedProvider(active=.T., team="SIGAFIN", tables="SA2", name="Partner", country="ALL")
class PartnerSmartView from IntegratedProvider
endclass
`;
    const results = extractSmartView(source, '/test.tlpp', 'fin');
    assert.strictEqual(results[0].display_name, 'Partner');
  });

  it('returns empty array for non-SmartView file', () => {
    const source = `
class RegularClass
endclass
`;
    const results = extractSmartView(source, '/test.tlpp', 'test');
    assert.strictEqual(results.length, 0);
  });
});

describe('extractExecAuto', () => {
  it('extracts MsExecAuto with caller function', () => {
    const source = `
Static Function MenuDef()
  Local aMenu as Array
  aMenu := {}
  MsExecAuto({|x,y| LOCA001(x,y)}, aMenu)
Return aMenu
`;
    const results = extractExecAuto(source, '/test.prw', 'rental');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].target_function, 'LOCA001');
    assert.strictEqual(results[0].caller_function, 'MenuDef');
  });

  it('extracts ExecAuto call', () => {
    const source = `
User Function ProcessData()
  Local data as Array
  ExecAuto({|x,y| ProcessItem(x,y)}, data)
Return .T.
`;
    const results = extractExecAuto(source, '/test.prw', 'test');
    assert.strictEqual(results[0].target_function, 'ProcessItem');
    assert.strictEqual(results[0].caller_function, 'ProcessData');
  });

  it('returns empty array when no ExecAuto', () => {
    const source = `
Function NormalFunc()
  Return Nil
`;
    const results = extractExecAuto(source, '/test.prw', 'test');
    assert.strictEqual(results.length, 0);
  });
});

describe('extractMvcPatterns', () => {
  it('extracts MPFormModel and SetPrimaryKey', () => {
    const source = `
Static Function ModelDef()
  Local oModel as Object
  oModel := MPFormModel():New("PARTNER_MODEL")
  oModel:SetPrimaryKey({"SA2_FILIAL", "SA2_COD"})
Return oModel
`;
    const results = extractMvcPatterns(source, '/test.prw', 'fin');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].model_id, 'PARTNER_MODEL');
    assert.deepStrictEqual(results[0].primary_key, ['SA2_FILIAL', 'SA2_COD']);
  });

  it('extracts AddGrid detection', () => {
    const source = `
Static Function ModelDef()
  Local oModel as Object
  oModel := MPFormModel():New("MY_MODEL")
  oModel:AddGrid("ITEMS", "ITEM_MODEL")
Return oModel
`;
    const results = extractMvcPatterns(source, '/test.prw', 'test');
    assert.ok(results[0].has_grid);
  });

  it('extracts tables from FWFormStruct', () => {
    const source = `
Static Function ModelDef()
  Local oModel as Object
  oModel := MPFormModel():New("SALE_MODEL")
  oModel:AddStruct("SA3", FWFormStruct(1, "SA3"))
Return oModel
`;
    const results = extractMvcPatterns(source, '/test.prw', 'sales');
    assert.ok(results[0].tables.includes('SA3'));
  });

  it('returns empty array when no MVC patterns', () => {
    const source = `
Function PlainFunc()
  Return Nil
`;
    const results = extractMvcPatterns(source, '/test.prw', 'test');
    assert.strictEqual(results.length, 0);
  });
});

describe('extractIncludes', () => {
  it('extracts #include directives with double quotes', () => {
    const source = `
#include "tlpp-core.th"
#include "TOTVS.CH"
`;
    const results = extractIncludes(source, '/test.tlpp');
    assert.strictEqual(results.length, 2);
    assert.ok(results.some(r => r.include_name === 'tlpp-core.th'));
    assert.ok(results.some(r => r.include_name === 'TOTVS.CH'));
  });

  it('extracts #include directives with single quotes', () => {
    const source = `
#INCLUDE 'tlpp-rest.th'
#INCLUDE 'msobject.ch'
`;
    const results = extractIncludes(source, '/test.tlpp');
    assert.strictEqual(results.length, 2);
    assert.ok(results.some(r => r.include_name === 'tlpp-rest.th'));
  });

  it('handles #INCLUDE in uppercase', () => {
    const source = `
#INCLUDE "FILE.CH"
#include "OTHER.CH"
`;
    const results = extractIncludes(source, '/test.prw');
    assert.strictEqual(results.length, 2);
  });

  it('returns empty array when no includes', () => {
    const source = `
Function NoIncludes()
  Return Nil
`;
    const results = extractIncludes(source, '/test.prw');
    assert.strictEqual(results.length, 0);
  });
});
