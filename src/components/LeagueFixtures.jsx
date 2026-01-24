import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Award } from 'lucide-react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from '@/components/ui/pagination'

const LeagueFixtures = ({ matches, getTeamName, onUpdateMatch, readOnly = false }) => {
    // Group matches by round
    const rounds = {}
    matches.forEach(m => {
        if (!rounds[m.roundIdx]) rounds[m.roundIdx] = []
        rounds[m.roundIdx].push(m)
    })
    
    // Sort round keys
    const sortedRoundIndices = Object.keys(rounds).sort((a, b) => Number(a) - Number(b))
    const totalRounds = sortedRoundIndices.length

    const [currentPage, setCurrentPage] = useState(1) // Page = Round + 1
    const [editingMatchId, setEditingMatchId] = useState(null)
    const [scores, setScores] = useState({ home: '', away: '' })

    const handleMatchClick = (match) => {
        if (readOnly) return
        setEditingMatchId(match.id)
        setScores({
            home: match.homeScore !== null ? match.homeScore.toString() : '',
            away: match.awayScore !== null ? match.awayScore.toString() : ''
        })
    }

    const handleSave = (matchId) => {
        if (scores.home !== '' && scores.away !== '') {
            onUpdateMatch(matchId, parseInt(scores.home), parseInt(scores.away))
            setEditingMatchId(null)
            setScores({ home: '', away: '' })
        }
    }

    const handleCancel = () => {
        setEditingMatchId(null)
        setScores({ home: '', away: '' })
    }

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalRounds) {
            setCurrentPage(page)
        }
    }

    if (totalRounds === 0) return null;

    const currentRoundIdx = sortedRoundIndices[currentPage - 1]
    const currentMatches = rounds[currentRoundIdx] || []

    return (
        <div className="space-y-6">
             <div className="flex flex-col gap-4">
                 <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Badge variant="outline" className="text-base px-3 py-1">Round {currentPage} of {totalRounds}</Badge>
                    </h3>
                 </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 min-h-[300px] content-start">
                    {currentMatches.map(match => {
                            const isEditing = editingMatchId === match.id
                            const isCompleted = match.completed
                            const homeWon = isCompleted && match.homeScore > match.awayScore
                            const awayWon = isCompleted && match.awayScore > match.homeScore

                            if (isEditing) {
                            return (
                                <Card key={match.id} className="border-primary shadow-md">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium truncate w-24">{getTeamName(match.home)}</span>
                                                <Input 
                                                    type="number" 
                                                    className="w-16 text-center h-8" 
                                                    value={scores.home}
                                                    onChange={e => setScores({...scores, home: e.target.value})}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium truncate w-24">{getTeamName(match.away)}</span>
                                                <Input 
                                                    type="number" 
                                                    className="w-16 text-center h-8" 
                                                    value={scores.away}
                                                    onChange={e => setScores({...scores, away: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="flex-1" onClick={() => handleSave(match.id)}>Save</Button>
                                            <Button size="sm" variant="ghost" className="flex-1" onClick={handleCancel}>Cancel</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                            }

                            return (
                            <Card 
                                key={match.id} 
                                className={`transition-colors ${!readOnly ? 'cursor-pointer hover:border-primary/50' : ''}`}
                                onClick={() => handleMatchClick(match)}
                            >
                                <CardContent className="p-4 flex flex-col justify-center h-full gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className={`flex items-center gap-2 ${homeWon ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                            <span className="text-sm truncate max-w-[120px]">{getTeamName(match.home)}</span>
                                            {homeWon && <Award className="w-3 h-3 text-primary" />}
                                        </div>
                                        <span className={`font-mono ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {isCompleted ? match.homeScore : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className={`flex items-center gap-2 ${awayWon ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                                            <span className="text-sm truncate max-w-[120px]">{getTeamName(match.away)}</span>
                                            {awayWon && <Award className="w-3 h-3 text-primary" />}
                                        </div>
                                        <span className={`font-mono ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {isCompleted ? match.awayScore : '-'}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                            )
                    })}
                </div>

                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                onClick={() => handlePageChange(currentPage - 1)} 
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                        
                        {/* 
                          Simplified pagination logic: 
                          Show all pages if <= 7, otherwise simple Previous/Next flow or condensed.
                          For simplicity here, just showing current page context or simple range 
                        */}
                        {totalRounds <= 7 ? (
                            Array.from({ length: totalRounds }).map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink 
                                        isActive={currentPage === i + 1}
                                        onClick={() => handlePageChange(i + 1)}
                                        className="cursor-pointer"
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))
                        ) : (
                             // Condensed view for many rounds
                            <>
                                <PaginationItem>
                                     <PaginationLink isActive className="text-foreground">{currentPage}</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="px-2 text-muted-foreground">of {totalRounds}</span>
                                </PaginationItem>
                            </>
                        )}

                        <PaginationItem>
                            <PaginationNext 
                                onClick={() => handlePageChange(currentPage + 1)}
                                className={currentPage === totalRounds ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
}

export default LeagueFixtures
