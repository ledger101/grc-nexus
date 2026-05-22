// lib/email/templates/RoleAssignmentEmail.tsx
// React Email template for role assignment notifications.
// SERVER-SIDE ONLY — never import in client components.
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
} from '@react-email/components'

interface RoleAssignmentEmailProps {
  name: string
  role: string
  institutionName: string
}

export function RoleAssignmentEmail({ name, role, institutionName }: RoleAssignmentEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#F3F7FD', fontFamily: 'DM Sans, Arial, sans-serif', margin: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: '#050D1B',
              padding: '24px',
              borderRadius: '10px 10px 0 0',
            }}
          >
            <Heading
              style={{
                color: '#C8A44A',
                margin: 0,
                fontFamily: 'Georgia, serif',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              GRC-Nexus
            </Heading>
          </Section>

          {/* Body */}
          <Section
            style={{
              backgroundColor: '#FFFFFF',
              padding: '32px',
              borderRadius: '0 0 10px 10px',
              border: '1px solid #D7E2EF',
              borderTop: 'none',
            }}
          >
            <Heading
              as="h2"
              style={{
                color: '#0B1625',
                fontSize: 20,
                fontWeight: 600,
                marginTop: 0,
                marginBottom: 16,
              }}
            >
              Role Assignment Notification
            </Heading>

            <Text style={{ color: '#3A5270', fontSize: 14, lineHeight: '1.6' }}>
              Dear {name},
            </Text>

            <Text style={{ color: '#3A5270', fontSize: 14, lineHeight: '1.6' }}>
              Your role at{' '}
              <strong style={{ color: '#0B1625' }}>{institutionName}</strong> has been
              set to{' '}
              <strong style={{ color: '#0B1625' }}>{role}</strong>.
            </Text>

            <Text style={{ color: '#3A5270', fontSize: 14, lineHeight: '1.6' }}>
              You can now sign in to GRC-Nexus and select this role to access the
              platform and your governance tools.
            </Text>

            <Section
              style={{
                backgroundColor: '#F3F7FD',
                borderRadius: 8,
                padding: '16px 20px',
                marginTop: 24,
                border: '1px solid #D7E2EF',
              }}
            >
              <Text
                style={{
                  color: '#3A5270',
                  fontSize: 13,
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                If you did not expect this notification, please contact your
                institution administrator immediately.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
