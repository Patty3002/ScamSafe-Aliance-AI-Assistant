import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

// Consume the same report snapshot as Markdown so decisions and history agree.
export function formatWordReport(report: string): string[] {
  const result: string[] = []
  let section = ''
  let recommendation: string[] = []
  const flush = () => {
    if (!recommendation.length) return
    const first = ['Original recommendation:', 'Original justification:', 'Current proposed action:']
    result.push(recommendation[0], ...first.flatMap(prefix=>recommendation.slice(1).filter(line=>line.startsWith(prefix))),
      ...recommendation.slice(1).filter(line=>!first.some(prefix=>line.startsWith(prefix))))
    recommendation = []
  }
  for (const line of report.split(/\r?\n/)) {
    if (line.startsWith('## ')) { flush(); section = line.slice(3) }
    if (section === 'Employee input') {
      const input = /^(Original Case Intake|Employee clarification|Employee correction):\s*(.*)$/.exec(line)
      if (input) {
        result.push(`### ${input[1]}`)
        result.push(/^(Case ID and title|Summary|Parties|Timeline|Transactions)\s*:?$/i.test(input[2].trim()) ? `#### ${input[2].trim().replace(/:$/,'')}` : input[2])
        continue
      }
      if (/^(Case ID and title|Summary|Parties|Timeline|Transactions)\s*:?$/i.test(line.trim())) {
        result.push(`#### ${line.trim().replace(/:$/,'')}`); continue
      }
    }
    if (section === 'Recommendations and employee decisions' && line.startsWith('### ')) {
      flush(); recommendation = [line]; continue
    }
    if (line.startsWith('Execution status:')) flush()
    if (recommendation.length) recommendation.push(line)
    else result.push(line)
  }
  flush()
  return result
}

export function createReportDocument(report: string) {
  const children = formatWordReport(report).filter(line=>line.trim()).map(line=>{
    const heading=/^(#{1,4})\s+(.*)$/.exec(line)
    if(heading) return new Paragraph({
      text:heading[2],
      heading:heading[1].length===1?HeadingLevel.TITLE:heading[1].length===2?HeadingLevel.HEADING_1:heading[1].length===3?HeadingLevel.HEADING_2:HeadingLevel.HEADING_3,
      keepNext:true, spacing:{before:240,after:120},
    })
    const bullet=line.startsWith('- ')
    return new Paragraph({children:[new TextRun(bullet?line.slice(2):line)],
      ...(bullet?{bullet:{level:0}}:{}),spacing:{after:120},widowControl:true})
  })
  return new Document({
    creator:'ScamSafe Alliance',title:'Synthetic Case Report',description:'Employee-reviewed proposals. Not sent or executed.',
    styles:{default:{document:{run:{font:'Calibri',size:22,color:'000000'},paragraph:{spacing:{line:276}}},
      title:{run:{font:'Calibri',size:36,bold:true,color:'000000'}},
      heading1:{run:{font:'Calibri',size:28,bold:true,color:'000000'}},
      heading2:{run:{font:'Calibri',size:24,bold:true,color:'000000'}},
      heading3:{run:{font:'Calibri',size:22,bold:true,color:'000000'}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},children}],
  })
}

export async function buildDocxReport(report: string): Promise<Blob> {
  return Packer.toBlob(createReportDocument(report))
}
