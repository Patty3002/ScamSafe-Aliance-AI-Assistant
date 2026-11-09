import { expect, it } from 'vitest'
import { inflateRawSync } from 'node:zlib'
import { Packer } from 'docx'
import { createReportDocument, formatWordReport } from './docxReport'
import { buildReport } from './report'
import { localAnalyze } from './analysis'

it('separates employee input headings and leads recommendations with action content',()=>{
  const a=localAnalyze('Summary\nA suspicious invoice.\nParties\nA fictional supplier.','test','Bank contacted.\nReview pending.','The amount is AUD 500.')
  const lines=formatWordReport(buildReport(a,a.reviewDecisions))
  expect(lines).toContain('### Original Case Intake')
  expect(lines).toContain('#### Summary')
  expect(lines).toContain('#### Parties')
  expect(lines).toContain('### Employee clarification')
  expect(lines).toContain('Review pending.')
  expect(lines).toContain('### Employee correction')
  const start=lines.indexOf('## Recommendations and employee decisions')
  const block=lines.slice(start+1).filter(Boolean)
  expect(block[1]).toMatch(/^Original recommendation:/)
  expect(block[2]).toMatch(/^Original justification:/)
  expect(block[3]).toMatch(/^Current proposed action:/)
  expect(block[4]).toMatch(/^Proposed organisation:/)
})

function documentXml(zip: Buffer) {
  for(let i=0;i<zip.length-46;i++) {
    if(zip.readUInt32LE(i)!==0x02014b50) continue
    const nameLength=zip.readUInt16LE(i+28)
    if(zip.subarray(i+46,i+46+nameLength).toString()!=='word/document.xml') continue
    const local=zip.readUInt32LE(i+42)
    const start=local+30+zip.readUInt16LE(local+26)+zip.readUInt16LE(local+28)
    const data=zip.subarray(start,start+zip.readUInt32LE(i+20))
    return (zip.readUInt16LE(i+10)===8?inflateRawSync(data):data).toString()
  }
  throw new Error('Missing Word document part')
}

it('creates a Word package retaining report details, edits and history',async()=>{
  const a=localAnalyze('I made a bank transfer of AUD 500 yesterday.','SSA-DOCX')
  const r=a.recommendations[0]
  const decision={state:'modified' as const,editedAction:'Ask the bank to review the transfer.',notes:'Employee note & follow-up'}
  const report=buildReport(a,{[r.id]:decision},[{analysisVersion:1,recommendation:r,decision}])
  const xml=documentXml(await Packer.toBuffer(createReportDocument(report)))
  expect(xml).toContain('SSA-DOCX')
  expect(xml).toContain('Ask the bank to review the transfer.')
  expect(xml).toContain('Employee note &amp; follow-up')
  expect(xml).toContain('Superseded recommendations and review history')
  expect(xml).toContain('NOT SENT / NOT EXECUTED')
  expect(xml).toContain('w:pStyle w:val="Heading1"')
  expect(xml).not.toContain('## Case Summary')
})
