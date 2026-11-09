import type { Analysis } from './types'

export function conditionalActions(a: Analysis) {
  return a.clarifyingQuestions.map(question => {
    const key = a.modelExtraction?.missingInformation.find(m => m.question === question)?.key
    const q = question.toLowerCase()
    let cases: [string, string][] = []
    if (key === 'payment_route' || /payment method|payment made|payment route/.test(q)) cases = [
      ['Bank transfer', 'Contact the bank’s Fraud / Scam Response team to assess the transaction and protection.'],
      ['Card payment', 'Contact the card issuer’s Card Fraud / Disputes team to assess the payment and card protection.'],
      ['Third-party wallet', 'Contact the payment provider’s Payment Provider Fraud team.'],
      ['Platform-managed balance', 'Contact the digital platform’s Platform Balance Support team.'],
    ]
    else if (key === 'authorization' || /(?:authoris|authoriz).*(?:payment|transaction)|(?:payment|transaction).*(?:authoris|authoriz)/.test(q)) cases = [
      ['The person authorised the payment', 'Ask the actual payment institution to assess suspected merchant fraud and applicable dispute options; do not describe the payment as unauthorised.'],
      ['The person did not authorise the payment', 'Ask the actual payment institution to assess an unauthorised transaction and payment/account protection. Continuing charges require immediate handling.'],
    ]
    else if (/immediate danger/.test(q)) cases = [
      ['Immediate danger is reported', 'Immediately contact the Designated Safety Contact under the organisation’s safety procedure.'],
      ['No immediate danger is reported', 'Continue handling the independently reported financial, account or identity risks; offer support for evidenced needs.'],
    ]
    else if (key === 'protective_action' || key === 'institution_contact' || /protect|secured|secure|contacted/.test(q)) cases = [
      ['Effective protection is reported and harmful activity has stopped', 'Follow up with the responsible team on remaining investigation and recovery needs. Reassess urgency; other urgent risks still take precedence.'],
      ['Protection is incomplete, ineffective or unknown', 'Contact the responsible institution to confirm protection and assess ongoing risk immediately where P1 applies. Contact alone does not establish protection.'],
    ]
    else if (key === 'credential_type' || /password|credentials|account details/.test(q) && !/transactions|money loss/.test(q)) cases = [
      ['Credentials were disclosed or account access compromised', 'Contact the affected account provider’s Account Security team; banking/payment credentials or active takeover require immediate protection assessment. For identity documents, contact Identity Recovery Support; for card details, Card Fraud / Disputes.'],
      ['No credentials were disclosed and access remains secure', 'Continue the existing payment or suspicious-contact recommendation without adding an account-security referral solely for hypothetical exposure.'],
    ]
    else if (key === 'transaction_status' || /money|transactions|deduct|payment.*started/.test(q)) cases = [
      ['Money was sent or an unknown transaction occurred', 'Contact the actual payment institution’s fraud/disputes team to assess the transaction and protection. Recent unprotected payments or ongoing charges require immediate handling.'],
      ['No money was sent and no unknown transaction occurred', 'Pause any suspicious payment process and address the reported contact or credential risk. Keep any independently established urgent account risk active.'],
    ]
    else if (key === 'current_account_access' || /log in|login|access/.test(q)) cases = [
      ['Someone else still controls the account or unknown activity continues', 'Immediately contact the affected provider’s Account Security team to assess access protection and recovery.'],
      ['Control is restored and unknown activity has stopped', 'Ask the affected provider to confirm protection and follow up on remaining damage; reassess other risks separately.'],
    ]
    else if (key === 'contact_channel' || /channel|text message|webpage/.test(q)) cases = [
      ['Text message or telephone', 'Use the telecommunications provider’s Scam Messaging Reporting team.'],
      ['Platform content or account', 'Use the digital platform’s Trust & Safety team.'],
      ['General website of unknown origin', 'Use Scam Reporting & Case Coordination for incident recording.'],
    ]
    return { question, cases }
  })
}
