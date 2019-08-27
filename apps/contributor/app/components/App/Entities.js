import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'

import { useNetwork } from '@aragon/api-react'
import {
  Badge,
  ContextMenu,
  ContextMenuItem,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  Text,
} from '@aragon/ui'

import { Empty } from '../Card'

const entitiesSort = (a, b) => a.data.name.toUpperCase() > b.data.name.toUpperCase() ? 1 : -1

const Entities = ({ entities, onNewEntity, onRemoveEntity }) => {
  const removeEntity = address => () => onRemoveEntity(address)

  if (entities.length === 0) {
    return <Empty action={onNewEntity} />
  } else {
    return (
      <Table
        header={
          <TableRow>
            <TableHeader title="Entity" />
          </TableRow>
        }
      >
        {entities.sort(entitiesSort).map(({ data: { address, hashDigest, hashFunction, hashSize } }) => {
          return (
            <TableRow key={address}>
              <EntityCell>
                <EntityWrapper>
                  <Text
                    size="xlarge"
                    style={{
                      paddingBottom: '5px',
                    }}
                  >
                    {address}
                  </Text>
                </EntityWrapper>
              </EntityCell>
              <EntityCell align="right">
                <Badge foreground={typeRow.fg} background={typeRow.bg}>
                  {typeRow.name}
                </Badge>
              </EntityCell>
              <EntityCell
                align="right"
                style={{
                  width: '30px',
                }}
              >
                <ContextMenu>
                  <ContextMenuItem onClick={removeEntity(address)}>
                    Remove
                  </ContextMenuItem>
                </ContextMenu>
              </EntityCell>
            </TableRow>
          )
        })}
      </Table>
    )
  }
}

Entities.propTypes = {
  // TODO: shape better
  entities: PropTypes.array.isRequired,
  onNewEntity: PropTypes.func.isRequired,
  onRemoveEntity: PropTypes.func.isRequired,
}

const EntityCell = styled(TableCell)`
  padding: 15px;
`
const EntityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 10px;
`
export default Entities
